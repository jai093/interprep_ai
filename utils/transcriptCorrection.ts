/**
 * transcriptCorrection.ts
 * 
 * The Web Speech API phonetically mishears technical terms.
 * This utility corrects common errors in real-time transcripts
 * so candidates don't get penalized for the browser's mistakes.
 * 
 * Examples of known Web Speech API errors:
 *  "nocches"   → "Node.js"
 *  "no js"     → "Node.js"
 *  "nougat.js" → "Node.js"
 *  "reacts"    → "React"
 *  "type script" → "TypeScript"
 */

// Each entry: [wrongPattern (case-insensitive regex), correctReplacement]
const TECH_TERM_CORRECTIONS: [RegExp, string][] = [
    // Node.js — the main reported issue
    [/\bno[ck]?[cg]?[uh]?e?[sz]?\b/gi, 'Node.js'],
    [/\bno[- ]?js\b/gi, 'Node.js'],
    [/\bnodges?\b/gi, 'Node.js'],
    [/\bnoughts?\b/gi, 'Node.js'],
    [/\bnougat\.?js\b/gi, 'Node.js'],
    [/\bno\.?js\b/gi, 'Node.js'],
    [/\bnode j\.?s\.?\b/gi, 'Node.js'],

    // JavaScript ecosystem
    [/\bjava[- ]?script\b/gi, 'JavaScript'],
    [/\bjava script\b/gi, 'JavaScript'],
    [/\btype[- ]?script\b/gi, 'TypeScript'],
    [/\breact\.?js\b/gi, 'React.js'],
    [/\bvue\.?js\b/gi, 'Vue.js'],
    [/\bangular\.?js\b/gi, 'Angular.js'],
    [/\bnext\.?js\b/gi, 'Next.js'],
    [/\bnuxt\.?js\b/gi, 'Nuxt.js'],
    [/\bexpress\.?js\b/gi, 'Express.js'],
    [/\bnest\.?js\b/gi, 'Nest.js'],
    [/\bgraph[- ]?q[- ]?l\b/gi, 'GraphQL'],
    [/\bj[- ]?s\b/gi, 'JS'],  // "j s" → "JS"

    // Python ecosystem
    [/\bpython\b/gi, 'Python'],
    [/\bdj[ae]ngo\b/gi, 'Django'],
    [/\bflask\b/gi, 'Flask'],
    [/\bpandas?\b/gi, 'Pandas'],
    [/\bnumpy?\b/gi, 'NumPy'],
    [/\btensor[- ]?flow\b/gi, 'TensorFlow'],
    [/\bpy[- ]?torch\b/gi, 'PyTorch'],

    // Cloud & DevOps
    [/\ba[- ]?w[- ]?s\b/gi, 'AWS'],
    [/\bamazon web services\b/gi, 'Amazon Web Services'],
    [/\bgcp\b/gi, 'GCP'],
    [/\bgoogle cloud\b/gi, 'Google Cloud'],
    [/\bazure\b/gi, 'Azure'],
    [/\bkubernetes?\b/gi, 'Kubernetes'],
    [/\bkubernetes?\b/gi, 'Kubernetes'],
    [/\bkuber[- ]?netties\b/gi, 'Kubernetes'],
    [/\bkuber[- ]?neta?s\b/gi, 'Kubernetes'],
    [/\bdocker\b/gi, 'Docker'],
    [/\bci[/ ]?cd\b/gi, 'CI/CD'],
    [/\bterraform\b/gi, 'Terraform'],
    [/\bansible\b/gi, 'Ansible'],
    [/\bjenkins\b/gi, 'Jenkins'],

    // Databases
    [/\bpost[- ]?g?r?e?s\b/gi, 'PostgreSQL'],
    [/\bpost?gres[- ]?q[- ]?l\b/gi, 'PostgreSQL'],
    [/\bmy[- ]?sql\b/gi, 'MySQL'],
    [/\bmongo[- ]?d[bv]\b/gi, 'MongoDB'],
    [/\bmongo\b/gi, 'MongoDB'],
    [/\bsql\b/gi, 'SQL'],
    [/\bno[- ]?sql\b/gi, 'NoSQL'],
    [/\bredis\b/gi, 'Redis'],
    [/\belastic[- ]?search\b/gi, 'Elasticsearch'],

    // APIs & Protocols
    [/\br[- ]?e[- ]?s[- ]?t[- ]?ful?\b/gi, 'RESTful'],
    [/\brest[- ]?api\b/gi, 'REST API'],
    [/\bap[- ]?i\b/gi, 'API'],
    [/\bhttp\b/gi, 'HTTP'],
    [/\bhttps\b/gi, 'HTTPS'],
    [/\bjson\b/gi, 'JSON'],
    [/\bj[- ]?son\b/gi, 'JSON'],
    [/\bxml\b/gi, 'XML'],
    [/\bwebhook\b/gi, 'Webhook'],

    // Programming concepts
    [/\bo[- ]?o[- ]?p\b/gi, 'OOP'],
    [/\bsolid principles?\b/gi, 'SOLID principles'],
    [/\bmvc\b/gi, 'MVC'],
    [/\bmicro[- ]?services?\b/gi, 'microservices'],
    [/\bserver[- ]?less\b/gi, 'serverless'],
    [/\bdev[- ]?ops\b/gi, 'DevOps'],
    [/\bscrums?\b/gi, 'Scrum'],
    [/\bagile\b/gi, 'Agile'],
    [/\bkanban\b/gi, 'Kanban'],
    [/\bgit[- ]?hub\b/gi, 'GitHub'],
    [/\bgit[- ]?lab\b/gi, 'GitLab'],

    // Common leetcode/interview jargon
    [/\bbig[- ]?o\b/gi, 'Big-O'],
    [/\btime[- ]?com?plexity\b/gi, 'time complexity'],
    [/\blinked[- ]?list\b/gi, 'linked list'],
    [/\bhash[- ]?map\b/gi, 'hashmap'],
    [/\bbinary[- ]?search\b/gi, 'binary search'],
    [/\bdynamic[- ]?programming\b/gi, 'dynamic programming'],
    [/\bbread?th[- ]?first\b/gi, 'breadth-first'],
    [/\bdepth[- ]?first\b/gi, 'depth-first'],
];

/**
 * Fixes common Web Speech API phonetic misrecognitions for technical terms.
 * Applied to every transcript segment in real-time.
 */
export function correctTranscript(raw: string): string {
    if (!raw || raw.trim().length === 0) return raw;
    let corrected = raw;
    for (const [pattern, replacement] of TECH_TERM_CORRECTIONS) {
        corrected = corrected.replace(pattern, replacement);
    }
    return corrected;
}
