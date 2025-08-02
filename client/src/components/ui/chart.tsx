"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps>({
  config: {},
})

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider")
  }
  return context
}

type ChartProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, className, children, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ config }}>
        <div ref={ref} className={cn("", className)} {...props}>
          {children}
        </div>
      </ChartContext.Provider>
    )
  }
)
Chart.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {}
    Object.entries(config).forEach(([key, value]) => {
      if (value?.color) {
        vars[`--color-${key}`] = value.color
      }
      if (value?.theme) {
        Object.entries(value.theme).forEach(([themeKey, themeValue]) => {
          vars[`--color-${key}-${themeKey}`] = themeValue
        })
      }
    })
    return vars
  }, [config])

  return (
    <style
      id={id}
      dangerouslySetInnerHTML={{
        __html: `
          [data-chart="${id}"] {
            ${Object.entries(cssVars)
              .map(([key, value]) => `${key}: ${value};`)
              .join("\n")}
          }
        `,
      }}
    />
  )
}

type ChartTooltipProps = React.ComponentPropsWithoutRef<"div"> & {
  active?: boolean
  payload?: Array<{
    value?: number
    name?: string
    dataKey?: string
    payload?: any
    fill?: string
    color?: string
  }>
  indicator?: "dot" | "line"
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: string
  labelFormatter?: (value: any, payload: any) => React.ReactNode
  labelClassName?: string
  formatter?: (
    value: number,
    name: string,
    item: any,
    index: number,
    payload: any
  ) => React.ReactNode
  color?: string
  nameKey?: string
  labelKey?: string
}

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload?.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                            }
                          )}
                          style={{
                            "--color-border": indicatorColor,
                            "--color-bg": indicatorColor,
                          } as React.CSSProperties}
                        />
                      )
                    )}
                    <div className="flex flex-1 flex-col gap-0.5">
                      {itemConfig?.label ? (
                        <div className="text-xs text-muted-foreground">
                          {itemConfig.label}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {item.name}
                        </div>
                      )}
                      <div className="text-xs font-medium">
                        {item.value}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltip.displayName = "ChartTooltip"

type ChartLegendProps = React.ComponentPropsWithoutRef<"div"> & {
  payload?: Array<{
    value?: number
    name?: string
    dataKey?: string
    payload?: any
    fill?: string
    color?: string
  }>
  verticalAlign?: "top" | "middle" | "bottom"
}

const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(
  ({ payload, verticalAlign = "top", className, ...props }, ref) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap gap-2",
          {
            "justify-start": verticalAlign === "top",
            "justify-center": verticalAlign === "middle",
            "justify-end": verticalAlign === "bottom",
          },
          className
        )}
        {...props}
      >
        {payload.map((item) => {
          const key = `${item.name || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = item.payload?.fill || item.color

          return (
            <div
              key={item.dataKey}
              className="flex items-center gap-2"
            >
              {itemConfig?.icon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2.5 w-2.5 rounded-[2px] border border-border bg-background"
                  style={{
                    "--color-border": indicatorColor,
                    "--color-bg": indicatorColor,
                  } as React.CSSProperties}
                />
              )}
              <div className="flex flex-col gap-0.5">
                {itemConfig?.label ? (
                  <div className="text-xs text-muted-foreground">
                    {itemConfig.label}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {item.name}
                  </div>
                )}
                <div className="text-xs font-medium">
                  {item.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegend.displayName = "ChartLegend"

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: any,
  key: string
) {
  return config[key]
}

export {
  Chart,
  ChartStyle,
  ChartTooltip,
  ChartLegend,
  useChart,
}
