import { useEffect, useRef } from 'react';
import { supabase, isLiveSupabaseConfigured, realtimeHub } from '../lib/supabase';

interface UseRealtimeOptions {
  table: string;
  onInsert?: (record: any) => void;
  onUpdate?: (record: any) => void;
  onDelete?: (record: any) => void;
  onChange?: () => void;
}

export function useRealtimeSubscription({
  table,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeOptions) {
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const onChangeRef = useRef(onChange);

  // Keep callback refs fresh without triggering effect re-execution
  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const channelId = `realtime_${table}_${Math.random().toString(36).slice(2, 9)}`;

    if (isLiveSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            if (payload.eventType === 'INSERT' && onInsertRef.current) {
              onInsertRef.current(payload.new);
            }
            if (payload.eventType === 'UPDATE' && onUpdateRef.current) {
              onUpdateRef.current(payload.new);
            }
            if (payload.eventType === 'DELETE' && onDeleteRef.current) {
              onDeleteRef.current(payload.old);
            }
            if (onChangeRef.current) {
              onChangeRef.current();
            }
          }
        )
        .subscribe();

      return () => {
        try {
          channel.unsubscribe();
          if (supabase) {
            supabase.removeChannel(channel);
          }
        } catch (e) {
          console.warn(`Error during realtime cleanup for table ${table}:`, e);
        }
      };
    } else {
      // Local reactive fallback
      const unsubscribe = realtimeHub.subscribe(table, (payload) => {
        if (payload.event === 'INSERT' && onInsertRef.current) {
          onInsertRef.current(payload.new);
        }
        if (payload.event === 'UPDATE' && onUpdateRef.current) {
          onUpdateRef.current(payload.new);
        }
        if (payload.event === 'DELETE' && onDeleteRef.current) {
          onDeleteRef.current(payload.old);
        }
        if (onChangeRef.current) {
          onChangeRef.current();
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [table]);
}
