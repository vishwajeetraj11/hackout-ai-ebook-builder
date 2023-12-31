import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Eye, Loader, RefreshCcw, XCircle } from "lucide-react";
import { Cormorant, Inter } from "next/font/google";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";
import useEbookStore from "@/stores/ebookStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useShallow } from "zustand/react/shallow";

const cormorant = Cormorant({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

type Props = {
  chapter: { content: string; id: string };
  ebookTitle: string;
  shouldFetchContent: boolean;
  completedChapters: string[];
  setCompletedChapters: React.Dispatch<React.SetStateAction<string[]>>;
  onDelete: (chapterTitle: string) => void;
};

const ChapterCard = ({
  chapter,
  ebookTitle,
  shouldFetchContent,
  setCompletedChapters,
  onDelete,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: chapter.id });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const { languageStyle, pointOfView, toneOfChapters } = useEbookStore(
    useShallow((store) => ({
      pointOfView: store.pointOfView,
      languageStyle: store.languageStyle,
      toneOfChapters: store.toneOfChapters,
    }))
  );

  const { data, isSuccess, isLoading, refetch, isFetched, isRefetching } =
    useQuery({
      queryKey: ["Chapter Content", ebookTitle, chapter.content],
      enabled: shouldFetchContent,
      staleTime: Infinity,
      queryFn: async () => {
        const data = await axios.post("/api/generateChapterInfo", {
          chapterTitle: chapter.content,
          ebookTitle,
          options: { languageStyle, pointOfView, toneOfChapters },
        });
        if (data.data.chapterContent) {
          setCompletedChapters((prev) => {
            const chaptersSet = new Set(prev);
            chaptersSet.add(chapter.content);
            return Array.from(chaptersSet);
          });
        }
        return data;
      },
    });

  return (
    <div
      // ref={setNodeRef}
      // style={style}
      // {...attributes}
      // {...listeners}
      className="flex items-center justify-between mb-5 last:mb-0"
    >
      <div className="mb-3 font-normal text-gray-700 dark:text-gray-400y">
        <p className={cn(inter.className)}>{chapter.content}</p>
      </div>
      <div className="ml-auto flex gap-2">
        {(isLoading || isRefetching) && <Loader className="animate-spin" />}
        {isSuccess && !isRefetching && (
          <Link href={`#chapter-${chapter.content}`}>
            <Eye />
          </Link>
        )}
        {/* Only Enable Reload button after the content has been generated once. */}
        {isFetched && (
          <RefreshCcw
            onClick={() => {
              console.log("first");
              refetch();
            }}
            className={cn("cursor-pointer z-10", isRefetching && "hidden")}
          />
        )}
        {isSuccess && !isRefetching && (
          <XCircle
            className="z-10"
            onClick={(e) => onDelete(chapter.content)}
          />
        )}
      </div>
    </div>
  );
};

export default ChapterCard;
