import { useI18n } from "vue-i18n";

export type LocalizedEntityKind = "nodes" | "credentialTypes";

/**
 * Resolves display strings for nodes/credentials. The hardcoded strings in the
 * node/credential definition (lib/nodes/**, lib/credentials/**) are the English
 * source of truth; locale JSON only holds non-English overrides, so a missing
 * key here is expected and simply falls back to `fallback`.
 */
export function useEntityI18n(kind: LocalizedEntityKind) {
  const { t, te } = useI18n();

  const translateOr = (key: string, fallback: string) =>
    te(key) ? t(key) : fallback;

  const label = (entityName: string, fallback: string) =>
    translateOr(`${kind}.${entityName}.displayName`, fallback);

  const description = (entityName: string, fallback: string) =>
    translateOr(`${kind}.${entityName}.description`, fallback);

  const propertyLabel = (
    entityName: string,
    propertyName: string,
    fallback: string,
  ) =>
    translateOr(
      `${kind}.${entityName}.properties.${propertyName}.displayName`,
      fallback,
    );

  const propertyDescription = (
    entityName: string,
    propertyName: string,
    fallback: string,
  ) =>
    translateOr(
      `${kind}.${entityName}.properties.${propertyName}.description`,
      fallback,
    );

  const optionLabel = (
    entityName: string,
    propertyName: string,
    optionKey: string,
    fallback: string,
  ) =>
    translateOr(
      `${kind}.${entityName}.properties.${propertyName}.options.${optionKey}`,
      fallback,
    );

  return {
    translateOr,
    label,
    description,
    propertyLabel,
    propertyDescription,
    optionLabel,
  };
}
