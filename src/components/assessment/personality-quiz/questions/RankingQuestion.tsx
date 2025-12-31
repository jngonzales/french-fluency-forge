import { useState, useEffect } from "react";
import { RankingQuestion as RankingQuestionType } from "../quizConfig";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  question: RankingQuestionType;
  value: string[];
  onChange: (value: string[]) => void;
}

interface SortableItemProps {
  id: string;
  index: number;
  label: string;
}

function SortableItem({ id, index, label }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 bg-card select-none ${
        isDragging 
          ? "border-primary shadow-lg shadow-primary/20 z-50" 
          : "border-border hover:border-primary/50"
      } transition-colors`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-2 text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5" />
        <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
      </div>
      <span className="flex-1 font-medium">{label}</span>
    </div>
  );
}

export function RankingQuestion({ question, value, onChange }: Props) {
  const [items, setItems] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (value.length === 0) {
      setItems(question.items.map(item => item.id));
    } else {
      setItems(value);
    }
  }, [question.items, value]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onChange(newItems);
    }
  };

  const getItemLabel = (id: string) => {
    return question.items.find(item => item.id === id)?.text || id;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Drag to reorder • #1 = Most important
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((itemId, index) => (
              <motion.div
                key={itemId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SortableItem
                  id={itemId}
                  index={index}
                  label={getItemLabel(itemId)}
                />
              </motion.div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
