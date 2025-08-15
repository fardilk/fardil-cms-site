import { useDragLayer as _useDragLayer } from "react-dnd";

export function useIsDragging() {
  return _useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
  })).isDragging;
}