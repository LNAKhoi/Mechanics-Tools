import { Layout } from '../components/Layout';

export function PlaceholderPage({ title }: { title: string }) {
  return <Layout><main className="page-container min-h-[540px] py-[80px]"><h1 className="font-chakra text-[36px]">{title}</h1><p className="mt-[16px] text-xam">Trang này sẽ được hoàn thiện trong phần triển khai tiếp theo.</p></main></Layout>;
}
