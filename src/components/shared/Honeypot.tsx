"use client";

import { forwardRef } from "react";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

/**
 * Invisible decoy field. A human never sees it and so never fills it in;
 * form-spam bots fill every input they find, which marks them.
 *
 * Read through a ref rather than React state on purpose: a bot that assigns
 * `input.value` directly never fires a change event, so component state would
 * stay empty and the trap would never spring. The DOM value always has it.
 *
 * Hidden by position rather than `display:none` — some bots skip fields that
 * are display-hidden, and the point is that they do not skip this one.
 * `aria-hidden` + `tabIndex={-1}` keep it out of the keyboard order and out of
 * what a screen reader announces, so it costs real visitors nothing.
 */
const Honeypot = forwardRef<HTMLInputElement>(function Honeypot(_props, ref) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
      }}
    >
      <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
      <input
        ref={ref}
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
});

export default Honeypot;
