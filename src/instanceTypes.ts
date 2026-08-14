import type {
  CompanionActionSchemaWithoutResult,
  CompanionActionSchemaWithResult,
  CompanionFeedbackSchema,
  CompanionOptionValues,
  CompanionVariableValues,
  InstanceTypes,
  JsonValue,
} from '@companion-module/base'
import type { HogConfig } from './config.js'

export interface HogInstanceTypes extends InstanceTypes {
  config: HogConfig
  secrets: undefined
  actions: Record<
    string,
    CompanionActionSchemaWithoutResult<CompanionOptionValues> | CompanionActionSchemaWithResult<CompanionOptionValues, JsonValue>
  >
  feedbacks: Record<string, CompanionFeedbackSchema<CompanionOptionValues>>
  variables: CompanionVariableValues
}
