import { createContext, useContext } from 'react';
// go(sectionIndex) — moves to another section (candidate app and the reviewer form view)
export const NavCtx = createContext(() => {});
export const useNav = () => useContext(NavCtx);
