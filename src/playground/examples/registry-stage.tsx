import type { ComponentType } from 'react'

import type { PlaygroundValue } from '@/registry/types'

import type { StageProps } from '../example'

export interface RegistryConfig {
  /** The component of the registry entry's own playground. */
  readonly Component: ComponentType<Record<string, PlaygroundValue>>
  /** The props to pass, as the registry's playground resolves them. */
  readonly props: readonly [string, PlaygroundValue][]
  /** JSX tag and import line of the generated code. */
  readonly part: string
  readonly importLine: string
}

export function RegistryStage({ config }: StageProps<RegistryConfig>) {
  const { Component, props } = config
  return <Component {...Object.fromEntries(props)} />
}
