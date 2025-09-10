function analyzeBuildPatterns(targets) {
  const analysis = {
    inferredProjectTypes: {},
    commonPatterns: new Set(),
    uniquePatterns: new Set(),
  };

  const allBuildPatterns = [];

  for (const target of targets) {
    if (target.category === 'build' && target.buildPatterns && target.buildPatterns.length > 0) {
      allBuildPatterns.push(...target.buildPatterns);

      if (target.buildPatterns.includes('angular.json')) {
        analysis.inferredProjectTypes.angular = (analysis.inferredProjectTypes.angular || 0) + 1;
      } else if (target.buildPatterns.includes('next.config.js')) {
        analysis.inferredProjectTypes.nextjs = (analysis.inferredProjectTypes.nextjs || 0) + 1;
      } else if (target.buildPatterns.includes('vue.config.js')) {
        analysis.inferredProjectTypes.vue = (analysis.inferredProjectTypes.vue || 0) + 1;
      } else if (target.buildPatterns.includes('webpack.config.js')) {
        analysis.inferredProjectTypes.webpack = (analysis.inferredProjectTypes.webpack || 0) + 1;
      } else if (target.buildPatterns.includes('package.json')) {
        analysis.inferredProjectTypes.javascript = (analysis.inferredProjectTypes.javascript || 0) + 1;
      }
    }
  }

  const patternCounts = {};
  for (const pattern of allBuildPatterns) {
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  }

  for (const pattern in patternCounts) {
    if (patternCounts[pattern] === targets.filter(t => t.category === 'build' && t.buildPatterns && t.buildPatterns.length > 0).length) {
      analysis.commonPatterns.add(pattern);
    } else if (patternCounts[pattern] === 1) {
      analysis.uniquePatterns.add(pattern);
    }
  }

  return analysis;
}

export { analyzeBuildPatterns };