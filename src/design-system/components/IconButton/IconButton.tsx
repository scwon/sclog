import { Button, type ButtonProps } from '../Button/Button';
import { cn } from '@/lib/utils';

/** `IconButton`의 props. 글자가 없으므로 `label`(접근 가능한 이름)을 반드시 받는다. */
export type IconButtonProps = Omit<ButtonProps, 'variant' | 'size' | 'aria-label'> & {
  label: string;
};

/**
 * 아이콘 하나만 담는 30px 정사각 버튼. 평소에는 흐린 글자색이고, 마우스를 올리면 상태 바탕과 본 글자색이 된다.
 * 아이콘은 18px로 맞춘다. `asChild`로 링크에도 쓴다.
 */
export function IconButton({ label, className, ...props }: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('text-text-muted', className)}
      {...props}
    />
  );
}
