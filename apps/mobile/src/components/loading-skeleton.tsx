import { Skeleton } from '@/components/ui/skeleton';
import { View } from '@/components/ui/view';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <View style={{ gap: 12, flex: 1 }} className={className}>
      <Skeleton width={100} height={16} />
      <Skeleton width={200} height={20} />
      <Skeleton width={300} height={24} />
    </View>
  );
}
