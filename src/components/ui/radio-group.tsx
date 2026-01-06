import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
}>({});

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string, onValueChange?: (value: string) => void }
>(({ className, value, onValueChange, children, ...props }, ref) => {
  return (
    <div className={cn("grid gap-2", className)} ref={ref} {...props}>
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        {children}
      </RadioGroupContext.Provider>
    </div>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext);
  const isChecked = context.value === value;
  
  return (
    <button
      ref={ref}
      role="radio"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation(); // 버튼 클릭 시에도 전파 방지
        context.onValueChange?.(value);
      }}
      className={cn(
        "aspect-square h-5 w-5 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-all",
        isChecked ? "bg-primary border-primary" : "border-gray-400 dark:border-gray-500",
        className
      )}
      {...props}
    >
        {isChecked && (
            <div className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" />
        )}
    </button>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
