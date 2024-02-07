import { List, ListProps } from "@mui/material";
import { InfiniteData } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

type OmittedListProps = Omit<ListProps, "children" | "ref" | "component">;

type PagedType<T> = {
  items: T[];
  total: number;
  nextCursor?: string | null | undefined;
};

interface RenderRowProps<T> {
  key: number;
  row: T;
  style: React.CSSProperties;
}

interface InfiniteListParams<T, IPaged extends PagedType<T> = PagedType<T>> {
  data: InfiniteData<IPaged, number | null | undefined>;
  fetchNextPage: () => void;
  isFetching: boolean;
  fixedHeight?: number;
  renderRow: (row: RenderRowProps<T>) => React.ReactNode;
}

interface InfiniteListProps<T, IPaged extends PagedType<T> = PagedType<T>>
  extends InfiniteListParams<T, IPaged>,
    OmittedListProps {}

export default function InfiniteList<T>(props: InfiniteListProps<T>) {
  const {
    data,
    fetchNextPage,
    isFetching,
    fixedHeight,
    renderRow,
    ...listProps
  } = props;

  const total = useMemo(() => data.pages.at(-1)?.total ?? 0, [data.pages]);

  const currentTotal = useMemo(
    () => data.pages?.reduce((acc, page) => acc + page.items.length, 0) ?? 0,
    [data.pages],
  );

  const flatData = useMemo(
    () => data.pages?.flatMap((page) => page.items) ?? [],
    [data.pages],
  );

  const tableContainerRef = useRef<HTMLUListElement>(null);

  const virtualizer = useVirtualizer({
    getScrollElement: () => tableContainerRef.current,
    count: currentTotal,
    estimateSize: () => fixedHeight || 48,
    overscan: 10,
  });

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLUListElement | null) => {
      if (containerRefElement && fetchNextPage && total !== undefined) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 300px of the bottom of the table, fetch more data if there is any
        if (
          scrollHeight - scrollTop - clientHeight < 300 &&
          !isFetching &&
          currentTotal < total
        ) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, currentTotal, total],
  );

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  return (
    <List
      component={"ul"}
      {...listProps}
      ref={tableContainerRef}
      onScroll={(e) => {
        fetchMoreOnBottomReached(e.target as HTMLUListElement);
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem, index) => {
          const item = flatData[virtualItem.index] as T;
          const key = virtualItem.index;

          const newStyle: React.CSSProperties = {
            height: `${virtualItem.size}px`,
            transform: `translateY(${
              virtualItem.start - index * virtualItem.size
            }px)`,
          };

          return renderRow({
            key,
            row: item,
            style: newStyle,
          });
        })}
      </div>
    </List>
  );
}
