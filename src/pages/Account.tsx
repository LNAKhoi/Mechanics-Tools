import { AccountMenu } from '../components/account/AccountMenu';
import { ProfilePanel } from '../components/account/ProfilePanel';
import { Layout } from '../components/Layout';

export default function Account() {
  return <Layout headerVariant="loggedIn" assetGroup="user"><main className="flex min-h-[698px] flex-col items-center gap-[24px] bg-page px-[72px] py-[24px]"><AccountMenu /><ProfilePanel /><a className="w-full text-center text-[14px] font-medium leading-none text-red underline" href="#privacy">Privacy policy</a></main></Layout>;
}
