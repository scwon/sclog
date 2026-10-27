import { lazy, Suspense, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $toast } from '../../stores/toast';

/** 토스트는 처음 뜰 때 불러오는 청크다(첫 화면 JS에 넣지 않는다). */
const Toaster = lazy(() => import('./Toast'));

/**
 * 토스트 자리. 창 틀(`Shell`)이 한 번 그린다. 첫 토스트가 오기 전에는 아무것도 그리지 않고, 온 뒤로는 화면을
 * 옮겨도 남는 창 틀 안에서 `Toaster`를 계속 붙여 둔다.
 */
export function ToastHost() {
  const message = useStore($toast);
  const [needed, setNeeded] = useState(false);
  if (message !== null && !needed) setNeeded(true);
  if (!needed) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  );
}
