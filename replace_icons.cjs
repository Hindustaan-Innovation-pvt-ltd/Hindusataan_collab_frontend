const fs = require('fs');
const file = 'src/components/QuickInsertPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
    'logos:python': 'devicon:python',
    'logos:java': 'devicon:java',
    'logos:javascript': 'devicon:javascript',
    'logos:typescript-icon': 'devicon:typescript',
    'logos:c': 'devicon:c',
    'logos:c-plusplus': 'devicon:cplusplus',
    'logos:c-sharp': 'devicon:csharp',
    'logos:go': 'devicon:go',
    'logos:rust': 'devicon:rust',
    'logos:php': 'devicon:php',
    'logos:kotlin-icon': 'devicon:kotlin',
    'logos:swift': 'devicon:swift',
    'logos:dart': 'devicon:dart',
    'logos:html-5': 'devicon:html5',
    'logos:css-3': 'devicon:css3',
    'logos:tailwindcss-icon': 'devicon:tailwindcss',
    'logos:bootstrap': 'devicon:bootstrap',
    'skill-icons:expressjs-light': 'devicon:express',
    'logos:flask': 'devicon:flask',
    'logos:django-icon': 'devicon:django',
    'logos:spring-icon': 'devicon:spring',
    'logos:sqlite': 'devicon:sqlite',
    'logos:oracle': 'devicon:oracle',
    'lucide:server': 'mdi:server-network',
    'lucide:database': 'mdi:database',
    'mdi:scale-balance': 'carbon:load-balancer-vpc',
    'mdi:transit-connection-variant': 'carbon:api-gateway',
    'mdi:directions-fork': 'mdi:server-network-off',
    'lucide:router': 'mdi:router-network',
    'mdi:cached': 'mdi:memory',
    'lucide:shield': 'mdi:shield-check',
    'mdi:package-variant': 'mdi:docker',
    'mdi:lan': 'mdi:connection',
    'logos:github-icon': 'mdi:github'
};

const startIndex = content.indexOf('const TECHNICAL_ICONS = [');
const endIndex = content.indexOf('];', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    let block = content.substring(startIndex, endIndex);
    for (const [oldVal, newVal] of Object.entries(replacements)) {
        block = block.replace(new RegExp('"' + oldVal + '"', 'g'), '"' + newVal + '"');
    }
    content = content.substring(0, startIndex) + block + content.substring(endIndex);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully updated icons');
} else {
    console.log('TECHNICAL_ICONS block not found');
}
