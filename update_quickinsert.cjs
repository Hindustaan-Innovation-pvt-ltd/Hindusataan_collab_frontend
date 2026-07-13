import fs from 'fs';

const filePath = 'c:/Users/raksh/OneDrive/Documents/Desktop/Hindustaan colaab/Hindusataan_collab_frontend/src/components/QuickInsertPanel.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

// The TECHNICAL_ICONS block
const technicalIconsBlock = `
// Prepare Technical Icons
const TECHNICAL_ICONS = [
  // Programming Languages
  { id: "tech-python", name: "Python", searchText: "python programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:python" },
  { id: "tech-java", name: "Java", searchText: "java programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:java" },
  { id: "tech-javascript", name: "JavaScript", searchText: "javascript js programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:javascript" },
  { id: "tech-typescript", name: "TypeScript", searchText: "typescript ts programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:typescript" },
  { id: "tech-c", name: "C", searchText: "c programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:c" },
  { id: "tech-cplusplus", name: "C++", searchText: "c++ cpp programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:cplusplus" },
  { id: "tech-csharp", name: "C#", searchText: "c# csharp programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:csharp" },
  { id: "tech-go", name: "Go", searchText: "go golang programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:go" },
  { id: "tech-rust", name: "Rust", searchText: "rust programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:rust" },
  { id: "tech-php", name: "PHP", searchText: "php programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:php" },
  { id: "tech-kotlin", name: "Kotlin", searchText: "kotlin programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:kotlin" },
  { id: "tech-swift", name: "Swift", searchText: "swift programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:swift" },
  { id: "tech-dart", name: "Dart", searchText: "dart programming language", category: "Programming Languages", type: "iconify", iconifyName: "devicon:dart" },

  // Frontend
  { id: "tech-react", name: "React", searchText: "react frontend UI", category: "Frontend", type: "iconify", iconifyName: "logos:react" },
  { id: "tech-nextjs", name: "Next.js", searchText: "next.js nextjs react frontend", category: "Frontend", type: "iconify", iconifyName: "logos:nextjs-icon" },
  { id: "tech-vue", name: "Vue.js", searchText: "vue.js vue frontend", category: "Frontend", type: "iconify", iconifyName: "logos:vue" },
  { id: "tech-angular", name: "Angular", searchText: "angular frontend", category: "Frontend", type: "iconify", iconifyName: "logos:angular-icon" },
  { id: "tech-html5", name: "HTML5", searchText: "html5 markup frontend", category: "Frontend", type: "iconify", iconifyName: "devicon:html5" },
  { id: "tech-css3", name: "CSS3", searchText: "css3 styling frontend", category: "Frontend", type: "iconify", iconifyName: "devicon:css3" },
  { id: "tech-tailwindcss", name: "Tailwind CSS", searchText: "tailwind css styling frontend", category: "Frontend", type: "iconify", iconifyName: "devicon:tailwindcss" },
  { id: "tech-bootstrap", name: "Bootstrap", searchText: "bootstrap styling frontend", category: "Frontend", type: "iconify", iconifyName: "devicon:bootstrap" },

  // Backend
  { id: "tech-nodejs", name: "Node.js", searchText: "node.js nodejs backend", category: "Backend", type: "iconify", iconifyName: "logos:nodejs-icon" },
  { id: "tech-express", name: "Express.js", searchText: "express.js backend", category: "Backend", type: "iconify", iconifyName: "devicon:express" },
  { id: "tech-flask", name: "Flask", searchText: "flask backend python", category: "Backend", type: "iconify", iconifyName: "devicon:flask" },
  { id: "tech-django", name: "Django", searchText: "django backend python", category: "Backend", type: "iconify", iconifyName: "devicon:django" },
  { id: "tech-fastapi", name: "FastAPI", searchText: "fastapi backend python", category: "Backend", type: "iconify", iconifyName: "devicon:fastapi" },
  { id: "tech-springboot", name: "Spring Boot", searchText: "spring boot backend java", category: "Backend", type: "iconify", iconifyName: "devicon:spring" },
  { id: "tech-nestjs", name: "NestJS", searchText: "nestjs backend", category: "Backend", type: "iconify", iconifyName: "logos:nestjs" },

  // Databases
  { id: "tech-mysql", name: "MySQL", searchText: "mysql database sql", category: "Databases", type: "iconify", iconifyName: "logos:mysql" },
  { id: "tech-postgresql", name: "PostgreSQL", searchText: "postgresql database sql", category: "Databases", type: "iconify", iconifyName: "logos:postgresql" },
  { id: "tech-mongodb", name: "MongoDB", searchText: "mongodb database nosql", category: "Databases", type: "iconify", iconifyName: "logos:mongodb-icon" },
  { id: "tech-redis", name: "Redis", searchText: "redis database cache", category: "Databases", type: "iconify", iconifyName: "logos:redis" },
  { id: "tech-sqlite", name: "SQLite", searchText: "sqlite database sql", category: "Databases", type: "iconify", iconifyName: "devicon:sqlite" },
  { id: "tech-oracle", name: "Oracle", searchText: "oracle database sql", category: "Databases", type: "iconify", iconifyName: "devicon:oracle" },
  { id: "tech-sqlserver", name: "SQL Server", searchText: "sql server database sql", category: "Databases", type: "iconify", iconifyName: "devicon:microsoftsqlserver" },
  { id: "tech-mariadb", name: "MariaDB", searchText: "mariadb database sql", category: "Databases", type: "iconify", iconifyName: "logos:mariadb-icon" },
  { id: "tech-cassandra", name: "Cassandra", searchText: "cassandra database nosql", category: "Databases", type: "iconify", iconifyName: "logos:cassandra" },
  { id: "tech-dynamodb", name: "DynamoDB", searchText: "dynamodb database aws nosql", category: "Databases", type: "iconify", iconifyName: "logos:aws-dynamodb" },
  { id: "tech-elasticsearch", name: "Elasticsearch", searchText: "elasticsearch database search", category: "Databases", type: "iconify", iconifyName: "logos:elasticsearch" },

  // Cloud & DevOps
  { id: "tech-firebase", name: "Firebase", searchText: "firebase backend baas google", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:firebase" },
  { id: "tech-aws", name: "AWS", searchText: "aws amazon web services cloud", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:aws" },
  { id: "tech-azure", name: "Azure", searchText: "azure microsoft cloud", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:microsoft-azure" },
  { id: "tech-gcp", name: "Google Cloud", searchText: "google cloud gcp", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:google-cloud" },
  { id: "tech-docker", name: "Docker", searchText: "docker container", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:docker-icon" },
  { id: "tech-kubernetes", name: "Kubernetes", searchText: "kubernetes k8s", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:kubernetes" },
  { id: "tech-jenkins", name: "Jenkins", searchText: "jenkins ci cd", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:jenkins" },
  { id: "tech-github", name: "GitHub", searchText: "github source control", category: "Cloud & DevOps", type: "iconify", iconifyName: "mdi:github" },
  { id: "tech-gitlab", name: "GitLab", searchText: "gitlab source control", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:gitlab" },
  { id: "tech-terraform", name: "Terraform", searchText: "terraform iac", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:terraform-icon" },
  { id: "tech-nginx", name: "Nginx", searchText: "nginx server", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:nginx" },
  { id: "tech-prometheus", name: "Prometheus", searchText: "prometheus monitoring", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:prometheus" },
  { id: "tech-grafana", name: "Grafana", searchText: "grafana monitoring", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:grafana" },

  // AI / Machine Learning
  { id: "tech-openai", name: "OpenAI", searchText: "openai ai ml", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:openai-icon" },
  { id: "tech-chatgpt", name: "ChatGPT", searchText: "chatgpt ai llm", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:chatgpt-icon" },
  { id: "tech-ollama", name: "Ollama", searchText: "ollama ai llm", category: "AI / Machine Learning", type: "iconify", iconifyName: "simple-icons:ollama" },
  { id: "tech-huggingface", name: "Hugging Face", searchText: "hugging face ai ml", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:hugging-face-icon" },
  { id: "tech-tensorflow", name: "TensorFlow", searchText: "tensorflow ai ml", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:tensorflow" },
  { id: "tech-pytorch", name: "PyTorch", searchText: "pytorch ai ml", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:pytorch-icon" },
  { id: "tech-langchain", name: "LangChain", searchText: "langchain ai llm", category: "AI / Machine Learning", type: "iconify", iconifyName: "simple-icons:langchain" },
  { id: "tech-opencv", name: "OpenCV", searchText: "opencv computer vision ai", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:opencv" },
  { id: "tech-scikitlearn", name: "Scikit-learn", searchText: "scikit-learn ai ml", category: "AI / Machine Learning", type: "iconify", iconifyName: "devicon:scikitlearn" },
  { id: "tech-pandas", name: "Pandas", searchText: "pandas data", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:pandas-icon" },
  { id: "tech-numpy", name: "NumPy", searchText: "numpy data", category: "AI / Machine Learning", type: "iconify", iconifyName: "logos:numpy" },

  // Networking & Architecture
  { id: "tech-server", name: "Server", searchText: "server network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:server-network" },
  { id: "tech-database-arch", name: "Database", searchText: "database network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:database" },
  { id: "tech-api", name: "API", searchText: "api network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:api" },
  { id: "tech-restapi", name: "REST API", searchText: "rest api network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:api" },
  { id: "tech-graphql", name: "GraphQL", searchText: "graphql api network", category: "Networking & Architecture", type: "iconify", iconifyName: "logos:graphql" },
  { id: "tech-websocket", name: "WebSocket", searchText: "websocket network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:connection" },
  { id: "tech-loadbalancer", name: "Load Balancer", searchText: "load balancer network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:load-balancer-vpc" },
  { id: "tech-apigateway", name: "API Gateway", searchText: "api gateway network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:api-gateway" },
  { id: "tech-reverseproxy", name: "Reverse Proxy", searchText: "reverse proxy network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:server-network-off" },
  { id: "tech-dns", name: "DNS", searchText: "dns network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:dns" },
  { id: "tech-cdn", name: "CDN", searchText: "cdn network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:content-delivery-network" },
  { id: "tech-vpn", name: "VPN", searchText: "vpn network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:vpn" },
  { id: "tech-router", name: "Router", searchText: "router network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:router-network" },
  { id: "tech-switch", name: "Switch", searchText: "switch network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:switch" },
  { id: "tech-firewall", name: "Firewall", searchText: "firewall network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:firewall" },
  { id: "tech-queue", name: "Queue", searchText: "queue network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:tray-full" },
  { id: "tech-cache", name: "Cache", searchText: "cache network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:memory" },
  { id: "tech-rabbitmq", name: "RabbitMQ", searchText: "rabbitmq queue network", category: "Networking & Architecture", type: "iconify", iconifyName: "logos:rabbitmq-icon" },
  { id: "tech-kafka", name: "Kafka", searchText: "kafka queue network", category: "Networking & Architecture", type: "iconify", iconifyName: "logos:kafka" },
  { id: "tech-microservice", name: "Microservice", searchText: "microservice architecture", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:microservices-1" },
  { id: "tech-container", name: "Container", searchText: "container architecture", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:docker" },
  { id: "tech-storage", name: "Storage", searchText: "storage architecture", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:database-outline" },

  // Security
  { id: "tech-jwt", name: "JWT", searchText: "jwt security", category: "Security", type: "iconify", iconifyName: "logos:jwt-icon" },
  { id: "tech-oauth", name: "OAuth", searchText: "oauth security", category: "Security", type: "iconify", iconifyName: "logos:oauth" },
  { id: "tech-ssl", name: "SSL", searchText: "ssl security", category: "Security", type: "iconify", iconifyName: "mdi:ssl" },
  { id: "tech-tls", name: "TLS", searchText: "tls security", category: "Security", type: "iconify", iconifyName: "mdi:security" },
  { id: "tech-shield", name: "Shield", searchText: "shield security", category: "Security", type: "iconify", iconifyName: "mdi:shield-check" },
];

const TECHNICAL_ICONS_ENTRY = { 
  id: "library-technical-icons", 
  name: "Technical Icons", 
  searchText: "technical icons programming cloud database", 
  category: "Folder", 
  type: "folder", 
  kind: "technical_icons", 
  emoji: "💻" 
};
`;

if (!content.includes('TECHNICAL_ICONS_ENTRY')) {
  content = content.replace(
    'const SEARCH_DATA = [...DEVICE_FRAMES, ...SHAPES, ...EMOJIS, ...LUCIDE_ICONS];',
    technicalIconsBlock + '\nconst SEARCH_DATA = [TECHNICAL_ICONS_ENTRY, ...DEVICE_FRAMES, ...SHAPES, ...EMOJIS, ...LUCIDE_ICONS];'
  );
}

// Add state for technical_icons tab if not present
if (!content.includes('"technical_icons"')) {
  content = content.replace(
    'const [activeTab, setActiveTab] = useState<"library" | "emojis">("library");',
    'const [activeTab, setActiveTab] = useState<"library" | "emojis" | "technical_icons">("library");'
  );
}

// Update the handleInsert logic for folder
if (!content.includes('item.type === "folder"')) {
  content = content.replace(
    'onInsertDeviceFrame(item.kind, sizeScale);\n    }',
    'onInsertDeviceFrame(item.kind, sizeScale);\n    } else if (item.type === "folder") {\n      if (item.kind === "technical_icons") {\n        setActiveTab("technical_icons");\n        setQuery("");\n        return;\n      }\n    }'
  );
}

// Ensure the actual TECHNICAL_ICONS array is added to Fuse if it's the active tab
if (!content.includes('if (activeTab === "technical_icons")')) {
  content = content.replace(
    'const fuse = new Fuse(SEARCH_DATA, {',
    'const fuse = new Fuse(SEARCH_DATA, {\n  keys: [\n    { name: "searchText", weight: 1 },\n    { name: "name", weight: 2 },\n  ],\n  threshold: 0.3,\n  ignoreLocation: true,\n});\nconst fuseTech = new Fuse(TECHNICAL_ICONS, {'
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done inserting initial structure!');
