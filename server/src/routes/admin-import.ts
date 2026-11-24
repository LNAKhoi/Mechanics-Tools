import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import multer from "multer";
import yauzl from "yauzl";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAdmin, requirePermission } from "../auth/middleware.js";
import { importStagingDir, uploadsDir } from "../paths.js";
import { imageType } from "./admin-upload.js";

const HEADERS = [
  "Mã sản phẩm (SKU) *",
  "Tên sản phẩm *",
  "Danh mục *",
  "Thương hiệu",
  "Giá (VNĐ)",
  "Tồn kho",
  "Bán chạy",
  "Mô tả",
  "Thông số",
  "Ảnh",
];
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_ZIP_UPLOAD = 200 * 1024 * 1024;
const MAX_ZIP_UNCOMPRESSED = MAX_ZIP_UPLOAD;
let maxZipUncompressed = 200 * 1024 * 1024;
const stagingRoot = importStagingDir;
type Row = {
  row: number;
  status: "new" | "update" | "error";
  note: string;
  data?: Record<string, unknown>;
  imageFiles: string[];
};
type Stage = {
  id: string;
  adminId: number;
  expires: number;
  rows: Row[];
  dir: string;
};
const stages = new Map<string, Stage>();
/** Test-only controls for limits and staged-session expiry. */
export const importTestHooks = {
  setMaxZipUncompressed(bytes: number) {
    maxZipUncompressed = bytes;
  },
  reset() {
    maxZipUncompressed = 200 * 1024 * 1024;
  },
  expire(id: string) {
    const stage = stages.get(id);
    if (stage) stage.expires = 0;
  },
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ZIP_UPLOAD, files: 302 },
});
/** ExcelJS cells can be primitives, rich text, formulas, hyperlinks, or empty. */
const cell = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return String(value).trim();
  if (typeof value === "object") {
    const entry = value as {
      result?: unknown;
      text?: unknown;
      hyperlink?: unknown;
      richText?: { text?: unknown }[];
    };
    if (entry.result != null) return cell(entry.result);
    if (entry.richText) return entry.richText.map((part) => cell(part.text)).join("").trim();
    if (entry.text != null) return cell(entry.text);
    if (entry.hyperlink != null) return String(entry.hyperlink).trim();
  }
  return "";
};
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 110) || `san-pham-${randomUUID().slice(0, 8)}`;
const integer = (value: string) =>
  value === ""
    ? undefined
    : /^\d+$/.test(value) && Number(value) <= 2147483647
      ? Number(value)
      : null;
const pngJpgWebp = (b: Buffer) =>
  imageType("image/png", b) ||
  imageType("image/jpeg", b) ||
  imageType("image/webp", b);

async function cleanup() {
  for (const [id, stage] of stages)
    if (stage.expires < Date.now()) {
      stages.delete(id);
      await fs.rm(stage.dir, { recursive: true, force: true });
    }
}
async function zipImages(bytes: Buffer) {
  const images: { name: string; bytes: Buffer }[] = [];
  const invalidNames = new Set<string>();
  let total = 0;
  await new Promise<void>((resolve, reject) =>
    yauzl.fromBuffer(bytes, { lazyEntries: true }, (error, zip) => {
      if (error || !zip)
        return reject(error || new Error("Không đọc được file zip"));
      zip.readEntry();
      zip.on("entry", (entry) => {
        if (/^__MACOSX\//i.test(entry.fileName) || /\/$/.test(entry.fileName))
          return zip.readEntry();
        if (
          entry.fileName.startsWith("/") ||
          entry.fileName.split("/").includes("..") ||
          /^[A-Za-z]:/.test(entry.fileName)
        )
          return reject(new Error("Đường dẫn trong zip không hợp lệ"));
        total += entry.uncompressedSize;
        if (total > maxZipUncompressed)
          return reject(new Error("File zip exceeds the decompression limit"));
        if (total > MAX_ZIP_UNCOMPRESSED)
          return reject(new Error("File zip vượt quá giới hạn giải nén"));
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream)
            return reject(
              streamError || new Error("Không đọc được ảnh trong zip"),
            );
          const chunks: Buffer[] = [];
          stream.on("data", (c) => chunks.push(Buffer.from(c)));
          stream.on("error", reject);
          stream.on("end", () => {
            const b = Buffer.concat(chunks);
            const name = path.basename(entry.fileName).toLowerCase();
            if (b.length <= MAX_IMAGE && pngJpgWebp(b))
              images.push({ name, bytes: b });
            else invalidNames.add(name);
            zip.readEntry();
          });
        });
      });
      zip.on("end", resolve);
      zip.on("error", reject);
    }),
  );
  return { images, invalidNames, length: images.length };
}
async function legacyRowsFromWorkbook(bytes: Buffer) {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(bytes), {
    worksheets: "emit",
    sharedStrings: "cache",
    styles: "cache",
    hyperlinks: "ignore",
  });
  let values: string[][] = [];
  // The approved workbook's visible tab is localized, but its OOXML sheet name is
  // sometimes emitted as Sheet2. Identify it by its immutable header row instead.
  for await (const ws of reader) {
    const candidate: string[][] = [];
    for await (const row of ws)
      candidate.push((row.values as unknown[]).slice(1).map(cell));
    if (candidate[0]?.every((h, i) => h === HEADERS[i])) {
      values = candidate;
      break;
    }
  }
  if (!values.length)
    throw new Error("File không đúng mẫu: thiếu sheet Sản phẩm");
  const headers = values[0];
  const missing = HEADERS.filter((h, i) => headers[i] !== h);
  if (missing.length || headers.length !== HEADERS.length)
    throw new Error(
      `File không đúng mẫu: thiếu cột ${missing[0] || "hoặc có cột thừa"}`,
    );
  return values.slice(1, 1001);
}

async function rowsFromWorkbook(bytes: Buffer) {
  try {
    // The approved workbook contains legacy comments that ExcelJS cannot reconcile.
    // Strip only comment/VML metadata; cell values, styles, and worksheets remain intact.
    const archive = await JSZip.loadAsync(bytes);
    for (const name of Object.keys(archive.files)) {
      if (/^xl\/(comments(?:\/|\d+\.xml)|drawings\/.*\.vml)$/i.test(name)) {
        archive.remove(name);
        continue;
      }
      const entry = archive.file(name);
      if (!entry) continue;
      if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) {
        archive.file(
          name,
          (await entry.async("string")).replace(
            /<legacyDrawing[^>]*\/?\s*>/g,
            "",
          ),
        );
      }
      if (/^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/i.test(name)) {
        archive.file(
          name,
          (await entry.async("string")).replace(
            /<Relationship\b[^>]*(comments|vmlDrawing)[^>]*\/>/gi,
            "",
          ),
        );
      }
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      (await archive.generateAsync({ type: "nodebuffer" })) as never,
    );
    const worksheet = workbook.getWorksheet("S\u1ea3n ph\u1ea9m");
    if (!worksheet)
      throw new Error(
        "File kh\u00f4ng \u0111\u00fang m\u1eabu: thi\u1ebfu sheet S\u1ea3n ph\u1ea9m",
      );
    const headers = (worksheet.getRow(1).values as unknown[])
      .slice(1)
      .map(cell);
    const missing = HEADERS.filter(
      (header, index) => headers[index] !== header,
    );
    if (missing.length || headers.length !== HEADERS.length) {
      throw new Error(
        `File kh\u00f4ng \u0111\u00fang m\u1eabu: thi\u1ebfu c\u1ed9t ${missing[0] || "ho\u1eb7c c\u00f3 c\u1ed9t th\u1eeba"}`,
      );
    }
    if (worksheet.rowCount < 2)
      throw new Error(
        "File kh\u00f4ng \u0111\u00fang m\u1eabu: sheet S\u1ea3n ph\u1ea9m tr\u1ed1ng",
      );
    return Array.from(
      { length: Math.min(worksheet.rowCount - 1, 1000) },
      (_, index) =>
        (worksheet.getRow(index + 2).values as unknown[]).slice(1).map(cell),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("File kh\u00f4ng \u0111\u00fang m\u1eabu")
    )
      throw error;
    throw new Error(
      "File kh\u00f4ng \u0111\u00fang m\u1eabu: kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c file Excel",
    );
  }
}

export const adminImportRouter = Router();
adminImportRouter.post(
  "/products/import/preview",
  requireAdmin,
  requirePermission("products:write"),
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 300 },
    { name: "images[]", maxCount: 300 },
    { name: "zip", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      await cleanup();
      const files = req.files as Record<string, Express.Multer.File[]>;
      const book = files?.file?.[0];
      if (
        !book ||
        !/\.xlsx$/i.test(book.originalname) ||
        book.size > 5 * 1024 * 1024
      )
        return void res
          .status(400)
          .json({ error: "Chỉ nhận file .xlsx tối đa 5 MB" });
      const rawImages = [...(files.images || []), ...(files["images[]"] || [])];
      const extras = rawImages
        .filter((f) => f.size <= MAX_IMAGE && pngJpgWebp(f.buffer))
        .map((f) => ({
          name: path.basename(f.originalname).toLowerCase(),
          bytes: f.buffer,
        }));
      const invalidImages = new Set(
        rawImages
          .filter(
            (f) =>
              !extras.some(
                (image) =>
                  image.name === path.basename(f.originalname).toLowerCase(),
              ),
          )
          .map((f) => path.basename(f.originalname).toLowerCase()),
      );
      const zip = files.zip?.[0];
      const zipped = zip
        ? await zipImages(zip.buffer)
        : { images: [], invalidNames: new Set<string>(), length: 0 };
      zipped.invalidNames.forEach((name) => invalidImages.add(name));
      if (rawImages.length + zipped.length > 300)
        return void res.status(400).json({ error: "Tối đa 300 ảnh" });
      const images = new Map<string, Buffer>();
      [...extras, ...zipped.images].forEach((i) => {
        if (!images.has(i.name)) images.set(i.name, i.bytes);
      });
      const input = await rowsFromWorkbook(book.buffer);
      const categories = await prisma.category.findMany();
      const cats = new Map(
        categories.flatMap((c) => [
          [c.slug.toLowerCase(), c.id],
          [c.name.trim().toLowerCase(), c.id],
        ]),
      );
      const products = await prisma.product.findMany({
        select: { id: true, sku: true },
      });
      const existing = new Map(
        products.map((p) => [p.sku.trim().toLowerCase(), p]),
      );
      const seen = new Map<string, number>();
      const rows: Row[] = input.map((raw, index): Row | null => {
        const n = index + 2,
          r = Array.from({ length: HEADERS.length }, (_, column) => cell(raw[column])),
          sku = r[0],
          name = r[1],
          category = r[2];
        // The approved template styles empty rows through row 500. They are
        // worksheet padding, not import records.
        if (r.every((value) => value === "")) return null;
        const key = sku.toLowerCase();
        const imageNames = r[9]
          ? r[9]
              .split(";")
              .map((x) => x.trim())
              .filter(Boolean)
          : [];
        const invalid = imageNames.filter(
          (x) =>
            !/^https:\/\//i.test(x) &&
            invalidImages.has(path.basename(x).toLowerCase()),
        );
        if (!r.some(Boolean))
          return {
            row: n,
            status: "error",
            note: "Dòng trống",
            imageFiles: [],
          };
        if (!sku)
          return { row: n, status: "error", note: "Thiếu SKU", imageFiles: [] };
        if (seen.has(key))
          return {
            row: n,
            status: "error",
            note: `SKU trùng với dòng ${seen.get(key)}`,
            imageFiles: [],
          };
        seen.set(key, n);
        const prior = existing.get(key);
        if (!name)
          return {
            row: n,
            status: "error",
            note: "Thiếu tên sản phẩm",
            imageFiles: [],
          };
        if (!prior && !category)
          return {
            row: n,
            status: "error",
            note: "Thiếu tên sản phẩm hoặc danh mục",
            imageFiles: [],
          };
        const categoryId = category
          ? cats.get(category.toLowerCase())
          : undefined;
        if (category && !categoryId)
          return {
            row: n,
            status: "error",
            note: "Danh mục không tồn tại",
            imageFiles: [],
          };
      const price = integer(r[4] ?? ""),
        stock = integer(r[5] ?? "");
        if (price === null || stock === null)
          return {
            row: n,
            status: "error",
            note: "Giá và tồn kho phải là số nguyên không âm",
            imageFiles: [],
          };
      const best =
        (r[6] ?? "") === ""
            ? undefined
            : /^(có|yes|1)$/i.test(r[6])
              ? true
              : /^(không|khong|no|0)$/i.test(r[6])
                ? false
                : null;
        if (best === null)
          return {
            row: n,
            status: "error",
            note: "Bán chạy chỉ nhận Có/Không",
            imageFiles: [],
          };
        const specs = r[8]
          ? r[8]
              .split("|")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => {
                const [label, ...rest] = x.split(":");
                return { label: label.trim(), value: rest.join(":").trim() };
              })
              .filter((x) => x.label && x.value)
          : undefined;
        const missing = imageNames.filter(
          (x) =>
            !/^https:\/\//i.test(x) &&
            !images.has(path.basename(x).toLowerCase()),
        );
        const note = missing.length
          ? `Cảnh báo: không tìm thấy ảnh ${missing.join(", ")}`
          : "";
        if (invalid.length)
          return {
            row: n,
            status: prior ? "update" : "new",
            note: `C\u1ea3nh b\u00e1o: \u1ea3nh kh\u00f4ng h\u1ee3p l\u1ec7 ${invalid.join(", ")}`,
            data: {
              sku: prior?.sku ?? sku,
              name,
              categoryId,
              brand: r[3],
              price,
              stock,
              isBestseller: best,
              description: r[7],
              specs,
              imageNames,
            },
            imageFiles: imageNames
              .filter(
                (x) =>
                  !/^https:\/\//i.test(x) &&
                  images.has(path.basename(x).toLowerCase()),
              )
              .map((x) => path.basename(x).toLowerCase()),
          };
        return {
          row: n,
          status: prior ? "update" : "new",
          note,
          data: {
            sku: prior?.sku ?? sku,
            name,
            categoryId,
            brand: r[3],
            price,
            stock,
            isBestseller: best,
            description: r[7],
            specs,
            imageNames,
          },
          imageFiles: imageNames
            .filter(
              (x) =>
                !/^https:\/\//i.test(x) &&
                images.has(path.basename(x).toLowerCase()),
            )
            .map((x) => path.basename(x).toLowerCase()),
        };
      }).filter((row): row is Row => row !== null);
      const id = randomUUID(),
        dir = path.join(stagingRoot, id);
      await fs.mkdir(dir, { recursive: true });
      for (const [name, bytes] of images)
        await fs.writeFile(path.join(dir, name), bytes);
      stages.set(id, {
        id,
        adminId: req.admin!.id,
        expires: Date.now() + 30 * 60_000,
        rows,
        dir,
      });
      const counts = {
        added: rows.filter((r) => r.status === "new").length,
        updated: rows.filter((r) => r.status === "update").length,
        skipped: rows.filter((r) => r.status === "error").length,
      };
      res.json({
        id,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        counts,
        rows: rows.map(({ data, imageFiles, ...row }) => ({
          ...row,
          sku: data?.sku,
        })),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith("File không đúng mẫu") ||
          error.message.startsWith("Đường dẫn trong zip") ||
          error.message.startsWith("File zip"))
      )
        return void res.status(400).json({ error: error.message });
      if (error instanceof Error && error.message.includes("invalid relative path")) {
        return void res.status(400).json({ error: "File .zip khÃ´ng há»£p lá»‡" });
      }
      next(error);
    }
  },
);
adminImportRouter.post(
  "/products/import/:id/confirm",
  requireAdmin,
  requirePermission("products:write"),
  async (req, res, next) => {
    try {
      await cleanup();
      const stage = stages.get(String(req.params.id));
      if (!stage || stage.adminId !== req.admin!.id)
        return void res.status(404).json({ error: "Phiên nhập đã hết hạn" });
      const valid = stage.rows.filter((r) => r.status !== "error");
      let added = 0,
        updated = 0;
      const targets = new Map<string, string>();
      for (const row of valid)
        for (const name of row.imageFiles) {
          const b = await fs.readFile(path.join(stage.dir, name));
          const ext = pngJpgWebp(b);
          if (ext) targets.set(name, `${randomUUID()}${ext}`);
        }
      await prisma.$transaction(async (tx) => {
        for (const row of valid) {
          const d = row.data!;
          const existing = await tx.product.findFirst({
            where: { sku: { equals: String(d.sku), mode: "insensitive" } },
          });
          const imageNames = d.imageNames as string[];
          const urls = imageNames
            .map((name) =>
              /^https:\/\//i.test(name)
                ? name
                : targets.has(path.basename(name).toLowerCase())
                  ? `/uploads/${targets.get(path.basename(name).toLowerCase())}`
                  : undefined,
            )
            .filter(Boolean) as string[];
          const patch: any = {};
          for (const [key, value] of Object.entries(d)) {
            if (
              ["imageNames", "categoryId"].includes(key) ||
              value === undefined ||
              value === ""
            )
              continue;
            patch[key] = value;
          }
          if (d.categoryId) patch.categoryId = d.categoryId;
          if (imageNames.length)
            patch.images = {
              deleteMany: {},
              create: urls.map((url, sortOrder) => ({ url, sortOrder })),
            };
          if (existing) {
            await tx.product.update({
              where: { id: existing.id },
              data: patch,
            });
            updated++;
          } else {
            await tx.product.create({
              data: {
                slug: slugify(String(d.name)),
                sku: String(d.sku),
                name: String(d.name),
                brand: String(d.brand || "Không rõ"),
                price: Number(d.price ?? 0),
                stock: Number(d.stock ?? 0),
                description: String(d.description || ""),
                isBestseller: Boolean(d.isBestseller),
                specs: (d.specs || []) as any,
                categoryId: Number(d.categoryId),
                images: imageNames.length
                  ? {
                      create: urls.map((url, sortOrder) => ({
                        url,
                        sortOrder,
                      })),
                    }
                  : {},
              },
            });
            added++;
          }
        }
      });
      await fs.mkdir(uploadsDir, { recursive: true });
      for (const [name, target] of targets)
        await fs.copyFile(
          path.join(stage.dir, name),
          path.join(uploadsDir, target),
        );
      stages.delete(stage.id);
      await fs.rm(stage.dir, { recursive: true, force: true });
      res.json({ added, updated, skipped: stage.rows.length - valid.length });
    } catch (error) {
      next(error);
    }
  },
);
