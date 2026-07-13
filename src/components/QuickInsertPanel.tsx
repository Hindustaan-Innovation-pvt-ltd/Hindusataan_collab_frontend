import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import Fuse from "fuse.js";
import * as LucideIcons from "lucide-react";
import { Icon as IconifyIcon } from "@iconify/react";
import { SHAPE_KINDS } from "../constants";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useWorkspaceTheme } from "../contexts/WorkspaceThemeContext";

interface QuickInsertPanelProps {
  onInsertIcon: (name: string, sizeScale: number) => void;
  onInsertEmoji: (emoji: string, sizeScale: number) => void;
  onInsertShape: (kind: string, sizeScale: number) => void;
  onInsertDeviceFrame: (kind: string, sizeScale: number) => void;
  onClose: () => void;
}

// Prepare Lucide Icons
const NON_ICON_EXPORTS = new Set(["createLucideIcon", "default", "icons", "LucideIcon", "LucideProps"]);
const LUCIDE_ICONS = Object.entries(LucideIcons)
  .filter(([name, value]) => !NON_ICON_EXPORTS.has(name) && typeof value === "object" && /^[A-Z]/.test(name))
  .map(([name, Icon]) => {
    const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    return { id: `icon-${name}`, name, searchText: words, category: "Icon", type: "icon", Icon: Icon as React.ComponentType<{ size?: number }> };
  });

// Prepare Device Frames
const DEVICE_FRAMES = [
  { id: "df-browser", name: "Browser Window", searchText: "browser window web internet ui", category: "Device Frame", type: "device_frame", kind: "browser", emoji: "🌐" },
  { id: "df-desktop", name: "Desktop Monitor", searchText: "desktop monitor pc computer mac screen", category: "Device Frame", type: "device_frame", kind: "desktop", emoji: "🖥" },
  { id: "df-laptop", name: "Laptop", searchText: "laptop macbook notebook computer pc", category: "Device Frame", type: "device_frame", kind: "laptop", emoji: "💻" },
  { id: "df-tablet", name: "Tablet", searchText: "tablet ipad surface device", category: "Device Frame", type: "device_frame", kind: "tablet", emoji: "📱" },
  { id: "df-phone", name: "Mobile Phone", searchText: "mobile phone iphone smartphone android device cell", category: "Device Frame", type: "device_frame", kind: "phone", emoji: "📱" },
];

// Prepare Shapes
const SHAPES = SHAPE_KINDS.map(s => ({
  id: `shape-${s.kind}`, name: s.label, searchText: `${s.label.toLowerCase()} shape`, category: "Shape", type: "shape", kind: s.kind, Icon: () => <div className="scale-75 origin-center">{s.icon}</div>
}));

// Basic Emojis (subset for quick insert search)
const EMOJIS = [
  { id: "em-smile", name: "Smile", searchText: "smile happy face emoji", category: "Emoji", type: "emoji", emoji: "😊" },
  { id: "em-thumbsup", name: "Thumbs Up", searchText: "thumbs up good yes ok emoji", category: "Emoji", type: "emoji", emoji: "👍" },
  { id: "em-heart", name: "Heart", searchText: "heart love like emoji", category: "Emoji", type: "emoji", emoji: "❤️" },
  { id: "em-check", name: "Checkmark", searchText: "check tick done success emoji", category: "Emoji", type: "emoji", emoji: "✅" },
  { id: "em-cross", name: "Cross", searchText: "cross x no error fail emoji", category: "Emoji", type: "emoji", emoji: "❌" },
  { id: "em-warning", name: "Warning", searchText: "warning alert caution emoji", category: "Emoji", type: "emoji", emoji: "⚠️" },
  { id: "em-star", name: "Star", searchText: "star favorite emoji", category: "Emoji", type: "emoji", emoji: "⭐" },
  { id: "em-fire", name: "Fire", searchText: "fire hot trending emoji", category: "Emoji", type: "emoji", emoji: "🔥" },
  { id: "em-rocket", name: "Rocket", searchText: "rocket launch ship fast emoji", category: "Emoji", type: "emoji", emoji: "🚀" },
];

// Prepare Technical Icons
const TECHNICAL_ICONS = [
  // Programming Languages
  { id: "tech-python", name: "Python", searchText: "python programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:python" },
  { id: "tech-java", name: "Java", searchText: "java programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:java" },
  { id: "tech-javascript", name: "JavaScript", searchText: "javascript js programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:javascript" },
  { id: "tech-typescript", name: "TypeScript", searchText: "typescript ts programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:typescript-icon" },
  { id: "tech-c", name: "C", searchText: "c programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:c" },
  { id: "tech-cplusplus", name: "C++", searchText: "c++ cpp programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:c-plusplus" },
  { id: "tech-csharp", name: "C#", searchText: "c# csharp programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:c-sharp" },
  { id: "tech-go", name: "Go", searchText: "go golang programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:go" },
  { id: "tech-rust", name: "Rust", searchText: "rust programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:rust" },
  { id: "tech-php", name: "PHP", searchText: "php programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:php" },
  { id: "tech-kotlin", name: "Kotlin", searchText: "kotlin programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:kotlin-icon" },
  { id: "tech-swift", name: "Swift", searchText: "swift programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:swift" },
  { id: "tech-dart", name: "Dart", searchText: "dart programming language", category: "Programming Languages", type: "iconify", iconifyName: "logos:dart" },

  // Frontend
  { id: "tech-react", name: "React", searchText: "react frontend UI", category: "Frontend", type: "iconify", iconifyName: "logos:react" },
  { id: "tech-nextjs", name: "Next.js", searchText: "next.js nextjs react frontend", category: "Frontend", type: "iconify", iconifyName: "logos:nextjs-icon" },
  { id: "tech-vue", name: "Vue.js", searchText: "vue.js vue frontend", category: "Frontend", type: "iconify", iconifyName: "logos:vue" },
  { id: "tech-angular", name: "Angular", searchText: "angular frontend", category: "Frontend", type: "iconify", iconifyName: "logos:angular-icon" },
  { id: "tech-html5", name: "HTML5", searchText: "html5 markup frontend", category: "Frontend", type: "iconify", iconifyName: "logos:html-5" },
  { id: "tech-css3", name: "CSS3", searchText: "css3 styling frontend", category: "Frontend", type: "iconify", iconifyName: "logos:css-3" },
  { id: "tech-tailwindcss", name: "Tailwind CSS", searchText: "tailwind css styling frontend", category: "Frontend", type: "iconify", iconifyName: "logos:tailwindcss-icon" },
  { id: "tech-bootstrap", name: "Bootstrap", searchText: "bootstrap styling frontend", category: "Frontend", type: "iconify", iconifyName: "logos:bootstrap" },

  // Backend
  { id: "tech-nodejs", name: "Node.js", searchText: "node.js nodejs backend", category: "Backend", type: "iconify", iconifyName: "logos:nodejs-icon" },
  { id: "tech-express", name: "Express.js", searchText: "express.js backend", category: "Backend", type: "iconify", iconifyName: "skill-icons:expressjs-light" },
  { id: "tech-flask", name: "Flask", searchText: "flask backend python", category: "Backend", type: "iconify", iconifyName: "logos:flask" },
  { id: "tech-django", name: "Django", searchText: "django backend python", category: "Backend", type: "iconify", iconifyName: "logos:django-icon" },
  { id: "tech-fastapi", name: "FastAPI", searchText: "fastapi backend python", category: "Backend", type: "iconify", iconifyName: "devicon:fastapi" },
  { id: "tech-springboot", name: "Spring Boot", searchText: "spring boot backend java", category: "Backend", type: "iconify", iconifyName: "logos:spring-icon" },
  { id: "tech-nestjs", name: "NestJS", searchText: "nestjs backend", category: "Backend", type: "iconify", iconifyName: "logos:nestjs" },

  // Databases
  { id: "tech-mysql", name: "MySQL", searchText: "mysql database sql", category: "Databases", type: "iconify", iconifyName: "logos:mysql" },
  { id: "tech-postgresql", name: "PostgreSQL", searchText: "postgresql database sql", category: "Databases", type: "iconify", iconifyName: "logos:postgresql" },
  { id: "tech-mongodb", name: "MongoDB", searchText: "mongodb database nosql", category: "Databases", type: "iconify", iconifyName: "logos:mongodb-icon" },
  { id: "tech-redis", name: "Redis", searchText: "redis database cache", category: "Databases", type: "iconify", iconifyName: "logos:redis" },
  { id: "tech-sqlite", name: "SQLite", searchText: "sqlite database sql", category: "Databases", type: "iconify", iconifyName: "logos:sqlite" },
  { id: "tech-oracle", name: "Oracle", searchText: "oracle database sql", category: "Databases", type: "iconify", iconifyName: "logos:oracle" },
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
  { id: "tech-github", name: "GitHub", searchText: "github source control", category: "Cloud & DevOps", type: "iconify", iconifyName: "logos:github-icon" },
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
  { id: "tech-server", name: "Server", searchText: "server network", category: "Networking & Architecture", type: "iconify", iconifyName: "lucide:server" },
  { id: "tech-database-arch", name: "Database", searchText: "database network", category: "Networking & Architecture", type: "iconify", iconifyName: "lucide:database" },
  { id: "tech-api", name: "API", searchText: "api network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:api" },
  { id: "tech-restapi", name: "REST API", searchText: "rest api network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:api" },
  { id: "tech-graphql", name: "GraphQL", searchText: "graphql api network", category: "Networking & Architecture", type: "iconify", iconifyName: "logos:graphql" },
  { id: "tech-websocket", name: "WebSocket", searchText: "websocket network", category: "Networking & Architecture", type: "iconify", iconifyName: "logos:websocket" },
  { id: "tech-loadbalancer", name: "Load Balancer", searchText: "load balancer network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:load-balancer-vpc" },
  { id: "tech-apigateway", name: "API Gateway", searchText: "api gateway network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:gateway-api" },
  { id: "tech-reverseproxy", name: "Reverse Proxy", searchText: "reverse proxy network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:server-proxy" },
  { id: "tech-dns", name: "DNS", searchText: "dns network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:dns" },
  { id: "tech-cdn", name: "CDN", searchText: "cdn network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:content-delivery-network" },
  { id: "tech-vpn", name: "VPN", searchText: "vpn network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:vpn" },
  { id: "tech-router", name: "Router", searchText: "router network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:router" },
  { id: "tech-switch", name: "Switch", searchText: "switch network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:switch-layer-2" },
  { id: "tech-firewall", name: "Firewall", searchText: "firewall network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:firewall" },
  { id: "tech-queue", name: "Queue", searchText: "queue network", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:message-queue" },
  { id: "tech-cache", name: "Cache", searchText: "cache network", category: "Networking & Architecture", type: "iconify", iconifyName: "mdi:memory" },
  { id: "tech-rabbitmq", name: "RabbitMQ", searchText: "rabbitmq queue network", category: "Networking & Architecture", type: "iconify", iconifyName: "logos:rabbitmq-icon" },
  { id: "tech-kafka", name: "Kafka", searchText: "kafka queue network", category: "Networking & Architecture", type: "iconify", iconifyName: "logos:kafka" },
  { id: "tech-microservice", name: "Microservice", searchText: "microservice architecture", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:microservices-1" },
  { id: "tech-container", name: "Container", searchText: "container architecture", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:container-software" },
  { id: "tech-storage", name: "Storage", searchText: "storage architecture", category: "Networking & Architecture", type: "iconify", iconifyName: "carbon:object-storage" },

  // Security
  { id: "tech-jwt", name: "JWT", searchText: "jwt security", category: "Security", type: "iconify", iconifyName: "logos:jwt-icon" },
  { id: "tech-oauth", name: "OAuth", searchText: "oauth security", category: "Security", type: "iconify", iconifyName: "logos:oauth" },
  { id: "tech-ssl", name: "SSL", searchText: "ssl security", category: "Security", type: "iconify", iconifyName: "mdi:ssl" },
  { id: "tech-tls", name: "TLS", searchText: "tls security", category: "Security", type: "iconify", iconifyName: "mdi:security" },
  { id: "tech-shield", name: "Shield", searchText: "shield security", category: "Security", type: "iconify", iconifyName: "lucide:shield" },
  { id: "tech-lock", name: "Lock", searchText: "lock security", category: "Security", type: "iconify", iconifyName: "lucide:lock" },

  // Version Control
  { id: "tech-git", name: "Git", searchText: "git version control", category: "Version Control", type: "iconify", iconifyName: "logos:git-icon" },
  { id: "tech-branch", name: "Branch", searchText: "branch version control", category: "Version Control", type: "iconify", iconifyName: "mdi:source-branch" },
  { id: "tech-commit", name: "Commit", searchText: "commit version control", category: "Version Control", type: "iconify", iconifyName: "mdi:source-commit" },
  { id: "tech-merge", name: "Merge", searchText: "merge version control", category: "Version Control", type: "iconify", iconifyName: "mdi:source-merge" },
  { id: "tech-pullrequest", name: "Pull Request", searchText: "pull request version control", category: "Version Control", type: "iconify", iconifyName: "mdi:source-pull" },
];

const TECHNICAL_ICONS_ENTRY = {
  id: "tech-browser-entry",
  name: "Technical Icons",
  searchText: "technical icons devops cloud programming language backend frontend database",
  category: "Collection",
  type: "special_browser",
  Icon: LucideIcons.FolderCode
};

const SEARCH_DATA = [TECHNICAL_ICONS_ENTRY, ...DEVICE_FRAMES, ...SHAPES, ...EMOJIS, ...LUCIDE_ICONS];

const fuse = new Fuse(SEARCH_DATA, {
  keys: [
    { name: "searchText", weight: 1 },
    { name: "name", weight: 2 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
});

export default function QuickInsertPanel({ onInsertIcon, onInsertEmoji, onInsertShape, onInsertDeviceFrame, onClose }: QuickInsertPanelProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"library" | "emojis" | "technical_icons">("library");
  const [sizeScale, setSizeScale] = useState<number>(1);
  const { layout } = useWorkspaceTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [
        TECHNICAL_ICONS_ENTRY,
        ...DEVICE_FRAMES,
        ...SHAPES.slice(0, 5),
        ...EMOJIS,
        ...LUCIDE_ICONS.slice(0, 10),
      ];
    }

    // Exact category match boost
    let baseResults = fuse.search(query).map(r => r.item);

    // Sort logic to prioritize Device Frames if they match well
    baseResults.sort((a, b) => {
      // If both match well, boost Device Frame
      if (a.category === "Device Frame" && b.category !== "Device Frame") return -1;
      if (b.category === "Device Frame" && a.category !== "Device Frame") return 1;
      return 0;
    });

    return baseResults.slice(0, 50);
  }, [query]);

  const handleInsert = (item: any) => {
    if (item.type === "special_browser") {
      setActiveTab("technical_icons");
      setQuery("");
      return;
    }

    if (item.type === "icon") {
      onInsertIcon(item.name, sizeScale);
    } else if (item.type === "iconify") {
      onInsertIcon(`iconify:${item.iconifyName}`, sizeScale);
    } else if (item.type === "emoji") {
      onInsertEmoji(item.emoji, sizeScale);
    } else if (item.type === "shape") {
      onInsertShape(item.kind, sizeScale);
    } else if (item.type === "device_frame") {
      onInsertDeviceFrame(item.kind, sizeScale);
    }
    onClose();
  };

  return (
    <div className="flex flex-col bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border w-[320px] mb-1 overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
      {(activeTab === "library" || activeTab === "emojis") && (
        <div className="flex border-b border-border bg-muted/30">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeTab === "library" ? "text-foreground border-b-2 border-[#3742FA]" : "text-gray-400 hover:text-foreground"}`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab("emojis")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeTab === "emojis" ? "text-foreground border-b-2 border-[#3742FA]" : "text-gray-400 hover:text-foreground"}`}
          >
            Emojis
          </button>
        </div>
      )}

      {activeTab === "library" && (
        <>
          <div className="flex items-center gap-2 p-2.5 border-b border-border bg-muted/10">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Insert item..."
              className="flex-1 text-xs outline-none bg-transparent text-foreground placeholder:text-gray-400 font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter" && results.length > 0) {
                  handleInsert(results[0]);
                }
              }}
            />
            <button onClick={onClose} className="text-gray-400 hover:text-muted-foreground p-1 rounded hover:bg-muted">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {results.length === 0 ? (
              <div className="text-center text-[11px] text-gray-400 py-8">
                No items found
              </div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleInsert(item)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors text-left w-full group"
                >
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-[#4B5563] group-hover:text-foreground shrink-0 shadow-sm">
                    {item.type === "icon" || item.type === "special_browser" ? (
                      <item.Icon size={20} />
                    ) : item.type === "iconify" ? (
                      <IconifyIcon icon={item.iconifyName} fontSize={20} />
                    ) : item.type === "emoji" || item.type === "device_frame" ? (
                      <span className="text-[20px] leading-none">{item.emoji}</span>
                    ) : item.type === "shape" ? (
                      <item.Icon />
                    ) : null}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-xs font-semibold text-foreground truncate">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{item.category}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "technical_icons" && (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-2.5 border-b border-border bg-muted/10">
            <button onClick={() => { setActiveTab("library"); setQuery(""); }} className="text-gray-400 hover:text-foreground p-1 rounded hover:bg-muted">
              <LucideIcons.ArrowLeft size={16} />
            </button>
            <Search size={14} className="text-gray-400 shrink-0 ml-1" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tech icons..."
              className="flex-1 text-xs outline-none bg-transparent text-foreground placeholder:text-gray-400 font-medium"
            />
            <button onClick={onClose} className="text-gray-400 hover:text-muted-foreground p-1 rounded hover:bg-muted">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {(() => {
              const techResults = query.trim()
                ? new Fuse(TECHNICAL_ICONS, { keys: ["name", "searchText", "category"], threshold: 0.3 }).search(query).map(r => r.item)
                : TECHNICAL_ICONS;

              if (techResults.length === 0) return <div className="text-center text-[11px] text-gray-400 py-8">No icons found</div>;

              if (query.trim()) {
                return techResults.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleInsert(item)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors text-left w-full group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-[#4B5563] group-hover:text-foreground shrink-0 shadow-sm">
                      <IconifyIcon icon={item.iconifyName} fontSize={20} />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-xs font-semibold text-foreground truncate">{item.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{item.category}</span>
                    </div>
                  </button>
                ));
              } else {
                const groups = techResults.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {} as Record<string, typeof TECHNICAL_ICONS>);

                return Object.entries(groups).map(([cat, items]) => (
                  <div key={cat} className="mb-2">
                    <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">{cat}</div>
                    <div className="grid grid-cols-4 gap-1 px-1">
                      {items.map(item => (
                        <button
                          key={item.id}
                          title={item.name}
                          onClick={() => handleInsert(item)}
                          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-muted transition-colors gap-1 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-[#4B5563] group-hover:text-foreground shadow-sm">
                            <IconifyIcon icon={item.iconifyName} fontSize={20} />
                          </div>
                          <span className="text-[9px] font-medium text-gray-500 truncate w-full text-center group-hover:text-foreground">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              }
            })()}
          </div>
        </div>
      )}

      {activeTab === "emojis" && (
        <div className="flex flex-col">
          <EmojiPicker
            theme={layout === "horizontal" ? Theme.LIGHT : Theme.DARK}
            onEmojiClick={(emojiData) => {
              onInsertEmoji(emojiData.emoji, sizeScale);
              onClose();
            }}
            width={318}
            height={380}
            style={{ border: 'none', borderRadius: 0 }}
          />
        </div>
      )}

      <div className="flex items-center justify-between p-2 border-t border-border bg-muted/30">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Insert Size</span>
        <div className="flex bg-background border border-border rounded-lg p-0.5 shadow-sm">
          {[
            { label: "S", scale: 0.5 },
            { label: "M", scale: 1 },
            { label: "L", scale: 2 }
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setSizeScale(s.scale)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${sizeScale === s.scale
                  ? "bg-[#3742FA] text-white shadow"
                  : "text-gray-400 hover:text-foreground hover:bg-muted"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
