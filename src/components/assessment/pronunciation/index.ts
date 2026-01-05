// Export phrase-based module as default (with phoneme coverage)
export { default as PronunciationModule } from './PronunciationModuleWithPhrases';
// Keep other versions available
export { default as PronunciationModuleEnhanced } from './PronunciationModuleEnhanced';
export { default as PronunciationModuleLegacy } from './PronunciationModule';
export * from './pronunciationItems';
