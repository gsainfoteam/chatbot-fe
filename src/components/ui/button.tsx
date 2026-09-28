import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * shadcn(Base UI) Button.
 * variant/size는 프로젝트 디자인(기존 components/common/Button)에 맞춰 조정했습니다.
 * `default`, `outline`, `icon*`는 shadcn 내부 컴포넌트(dialog, calendar)가 사용하므로 유지합니다.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        primary:
          "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        secondary:
          "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground",
        danger: "bg-red-600 text-white hover:bg-red-700",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        accent:
          "bg-red-50 text-[var(--color-primary)] hover:bg-red-100 hover:text-[var(--color-primary-hover)]",
        link: "bg-transparent text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] hover:underline",
        dangerLink: "bg-transparent text-red-500 hover:text-red-700",
      },
      size: {
        default: "min-h-10 rounded-md px-4 py-2 text-sm",
        inline: "min-h-0 rounded-md p-0 text-sm",
        sm: "min-h-8 rounded-md px-3 py-1.5 text-sm",
        md: "min-h-10 rounded-md px-4 py-2 text-sm",
        lg: "min-h-11 rounded-lg px-5 py-2.5 text-base",
        icon: "size-8 rounded-md",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- shadcn 표준: calendar 등이 buttonVariants를 재사용
export { Button, buttonVariants }
