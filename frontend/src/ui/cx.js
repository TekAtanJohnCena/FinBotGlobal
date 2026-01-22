// src/ui/cx.js
export const cx = (...classes) => classes.filter(Boolean).join(" ");
