"use client";

import { Dialog, DialogTrigger, DialogPortal, DialogPopup, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PracticeStartForm } from "./practice-start-form";
import { type TopicOption } from "./topic-multi-select";

export function PracticeStartDialog({ topics }: { topics: TopicOption[] }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button size="lg" />}>Practice Now 🚀</DialogTrigger>
      <DialogPortal>
        <DialogPopup>
          <DialogTitle>Start Practice</DialogTitle>
          <PracticeStartForm topics={topics} />
          <DialogClose
            render={<Button variant="ghost" size="sm" />}
            className="absolute top-4 right-4"
          >
            ✕
          </DialogClose>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
