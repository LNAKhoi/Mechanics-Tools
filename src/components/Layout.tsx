import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header, type HeaderVariant } from './Header';
import { ChatBubbles, PromoPopup } from './ContentWidgets';

export function Layout({ children, headerVariant, assetGroup = 'home' }: { children: ReactNode; headerVariant?: HeaderVariant; assetGroup?: string }) {
  return <div className="min-h-screen bg-page"><Header variant={headerVariant} assetGroup={assetGroup} />{children}<Footer assetGroup={assetGroup} /><ChatBubbles/><PromoPopup/></div>;
}
