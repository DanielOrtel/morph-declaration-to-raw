import { ClassDeclaration, MethodDeclaration, PropertyDeclaration, SyntaxKind } from 'ts-morph';

function getPropInInheritance(
  classDeclaration: ClassDeclaration,
  propertyName: string,
  required = false,
  isStatic = false,
  isMethod = false
) {
  let property: PropertyDeclaration | MethodDeclaration | undefined;

  if (isMethod) {
    if (isStatic) {
      property = classDeclaration.getStaticMethod(propertyName) as MethodDeclaration;
    } else {
      property = classDeclaration.getInstanceMethod(propertyName);
    }
  } else {
    if (isStatic) {
      property = classDeclaration.getStaticProperty(propertyName) as PropertyDeclaration;
    } else {
      property = classDeclaration.getProperty(propertyName);

      if (!property) {
        property = getPropertyFromConstructor(classDeclaration, propertyName);
      }
    }
  }

  if (!property) {
    const baseClass = classDeclaration.getBaseClass();

    if (!baseClass) {
      if (required) {
        throw new Error(
          `Could not find required static ${propertyName}. You need to define it in every resource or a parent abstract resource`
        );
      } else {
        return null;
      }
    }

    return getPropInInheritance(baseClass, propertyName, required, isStatic, isMethod);
  }

  return property;
}

/**
 * Get property from inheritance chain
 * @param classDeclaration
 * @param propertyName
 * @param required
 * @param isStatic
 */
export function getPropertyInInheritance(
  classDeclaration: ClassDeclaration,
  propertyName: string,
  required = false,
  isStatic = true
): PropertyDeclaration | null {
  return getPropInInheritance(classDeclaration, propertyName, required, isStatic, false) as PropertyDeclaration | null;
}

/**
 * Get method from inheritance chain
 * @param classDeclaration
 * @param propertyName
 * @param required
 * @param isStatic
 */
export function getMethodInInheritance(
  classDeclaration: ClassDeclaration,
  propertyName: string,
  required = false,
  isStatic = true
): MethodDeclaration | null {
  return getPropInInheritance(classDeclaration, propertyName, required, isStatic, true) as MethodDeclaration | null;
}

/**
 * Get property from constructor
 * @param classDeclaration
 * @param propertyName
 */
export function getPropertyFromConstructor(classDeclaration: ClassDeclaration, propertyName: string): any | null {
  const constructor = classDeclaration.getConstructors()[0];
  if (!constructor) {
    return null;
  }

  // Check constructor body for property assignments
  const statements = (constructor.getBody() as any)?.getStatements() || [];

  for (const statement of statements) {
    if (statement.getKind() === SyntaxKind.ExpressionStatement) {
      const expression = statement.asKind(SyntaxKind.ExpressionStatement)?.getExpression();
      if (expression?.getKind() === SyntaxKind.BinaryExpression) {
        const binaryExpression = expression.asKind(SyntaxKind.BinaryExpression);
        const left = binaryExpression?.getLeft().getText();
        if (left === `this.${propertyName}`) {
          return binaryExpression?.getRight();
        }
      }
    }
  }

  return null;
}
