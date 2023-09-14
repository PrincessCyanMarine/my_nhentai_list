export function isWithinElementBounds(
  elem: HTMLElement,
  pos: { x: number; y: number }
) {
  const rect = elem.getBoundingClientRect();
  console.log(rect);
  console.log(pos);
  return (
    pos.x >= rect.left &&
    pos.x <= rect.right &&
    pos.y >= rect.top &&
    pos.y <= rect.bottom
  );
}
