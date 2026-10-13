import { createContext, useContext } from 'react';
import { Shell } from '../components/Shell.jsx';
// The reviewer page frame (rail with the signed-in user and tabs, optional form steps).
// Frame is one stable component; what changes (user box, tabs) comes through FrameData.
export const FrameData = createContext({ railTop: null, brandSub: '', defTitle: '' });
export function Frame({ title, nav, children }) {
  const d = useContext(FrameData);
  return <Shell brandSub={d.brandSub} title={title || d.defTitle} railTop={d.railTop} nav={nav}>{children}</Shell>;
}
export const useFrame = () => Frame;
