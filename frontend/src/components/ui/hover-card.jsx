import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Context to share touch device state
const HoverCardContext = React.createContext({ isTouchDevice: false, open: false, setOpen: () => {} });

function HoverCard({
  openDelay = 200,
  closeDelay = 200,
  ...props
}) {
  const [open, setOpen] = React.useState(false);
  const isTouchDevice = React.useMemo(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // For touch devices, control open state manually
  if (isTouchDevice) {
    return (
      <HoverCardContext.Provider value={{ isTouchDevice, open, setOpen }}>
        <HoverCardPrimitive.Root 
          data-slot="hover-card" 
          open={open}
          onOpenChange={setOpen}
          {...props} 
        />
      </HoverCardContext.Provider>
    );
  }

  // For non-touch devices, use default hover behavior
  return (
    <HoverCardContext.Provider value={{ isTouchDevice, open, setOpen }}>
      <HoverCardPrimitive.Root 
        data-slot="hover-card" 
        openDelay={openDelay}
        closeDelay={closeDelay}
        {...props} 
      />
    </HoverCardContext.Provider>
  );
}

function HoverCardTrigger({
  className,
  ...props
}) {
  const { isTouchDevice, open, setOpen } = React.useContext(HoverCardContext);

  // For touch devices, toggle on click
  if (isTouchDevice) {
    return (
      <HoverCardPrimitive.Trigger 
        data-slot="hover-card-trigger"
        className={cn("cursor-pointer touch-manipulation", className)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        {...props} 
      />
    );
  }

  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" className={className} {...props} />;
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        {...props} />
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
