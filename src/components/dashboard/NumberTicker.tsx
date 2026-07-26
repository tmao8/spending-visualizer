"use client"

import CountUp from 'react-countup'
import { useEffect, useState } from 'react'

interface NumberTickerProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function NumberTicker({ value, prefix = "", suffix = "", decimals = 0, className }: NumberTickerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Initial server render matches final formatted string to avoid hydration mismatch, but it's not animated.
    return (
      <span className={className}>
        {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
      </span>
    )
  }

  return (
    <CountUp
      end={value}
      prefix={prefix}
      suffix={suffix}
      decimals={decimals}
      duration={1.5}
      separator=","
      className={className}
    />
  )
}
