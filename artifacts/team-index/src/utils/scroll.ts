/** Smooth-scroll to a section by its id, offset by the fixed navbar height */
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}
