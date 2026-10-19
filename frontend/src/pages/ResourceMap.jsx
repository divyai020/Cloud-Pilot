import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  Cloud, Globe, Server, Database, HardDrive, Zap, Shield, Network, Lock, Unlock,
  Search, Layers, Info, CheckCircle, Compass, Cpu, Radio, Key, Activity, Boxes,
  ArrowRight, Table2, ShieldCheck, X, ChevronDown, ChevronUp
} from "lucide-react";

/* ── Node metadata ─────────────────────────────────────────────────────── */
const nodeDetails = {
  internet: {
    title:"Global Internet Users", category:"External", categoryType:"networking", status:"Active",
    description:"Incoming public HTTP/HTTPS client traffic from customer browsers, mobile apps, and partner API integrations.",
    role:"Global Traffic Origin Point", latency:"< 18ms", securityRule:"SSL/TLS 1.3 Strict Ingress Encryption",
    telemetry:"Peak traffic: 4,200 req/sec",
    whyPattern:"Edge entry point where client TLS handshakes terminate, ensuring unauthenticated public traffic never reaches internal subnets directly.",
    failureImpact:"If upstream ISP or DNS routing fails, clients cannot reach edge endpoints. Mitigated by Route 53 multi-region DNS failover.",
    upstream:"Client Browsers & Mobile Apps (HTTPS / Port 443)", downstream:"Amazon Route 53 & CloudFront CDN",
    threatMitigation:"AWS Shield Standard defends against Layer 3/4 volumetric DDoS attacks automatically."
  },
  route53: {
    title:"Amazon Route 53 (DNS & Geo-Routing)", category:"Networking", categoryType:"networking", status:"Healthy",
    description:"Highly available cloud DNS service. Maps your domain to AWS endpoints with latency-based and failover routing.",
    role:"Edge DNS Resolution & Health Probes", latency:"2ms", securityRule:"DNSSEC enabled, AWS Shield DDoS mitigation",
    telemetry:"Query volume: 1.2M queries / day",
    whyPattern:"Provides 100% SLA DNS availability with Anycast network routing, directing users to the closest AWS edge location.",
    failureImpact:"DNS outage breaks domain resolution globally. Mitigated by 100% SLA Route 53 Anycast architecture.",
    upstream:"Global Internet Users", downstream:"CloudFront CDN Distribution & Application Load Balancer",
    threatMitigation:"DNSSEC prevents DNS spoofing and cache poisoning attacks."
  },
  cloudfront: {
    title:"Amazon CloudFront & AWS WAF", category:"Security & CDN", categoryType:"security", status:"Protected",
    description:"Global CDN with WAF integration. Caches static assets at 450+ edge locations. Blocks SQLi, XSS, bot traffic automatically.",
    role:"Edge Caching & Threat Defense", latency:"8ms", securityRule:"WAF Rule: OWASP Top 10, Rate limit 2000 req/5min",
    telemetry:"Cache Hit Ratio: 89.4%",
    whyPattern:"Offloads 89% of compute requests from backend EC2 servers by serving static assets from regional edge caches.",
    failureImpact:"Origin fallback automatically serves traffic from ALB if edge cache is cold, preventing user-facing downtime.",
    upstream:"Route 53 DNS Queries", downstream:"IGW -> Application Load Balancer",
    threatMitigation:"AWS WAF inspects HTTP headers for SQL injection, XSS, and automated credential stuffing."
  },
  igw: {
    title:"Internet Gateway (IGW)", category:"Networking", categoryType:"networking", status:"Available",
    description:"Horizontally scaled, redundant VPC component enabling bidirectional communication between VPC instances and the internet.",
    role:"VPC Edge Gateway", latency:"< 1ms", securityRule:"Stateless 1-to-1 NAT mapping for public IPs",
    whyPattern:"Managed VPC edge gateway that scales automatically, anchoring the perimeter of your 10.0.0.0/16 VPC.",
    failureImpact:"Managed by AWS with built-in multi-AZ redundancy; zero maintenance or single point of failure risk.",
    upstream:"CloudFront & Public Internet", downstream:"ALB & Public Subnet",
    threatMitigation:"Does not forward packets unless an explicit Route Table rule and Security Group allowlist exists."
  },
  "nat-gateway": {
    title:"Managed NAT Gateway", category:"Networking", categoryType:"networking", status:"Active",
    description:"Lets private instances connect outbound while blocking all incoming internet connections.",
    role:"Outbound-Only Internet Bridge", latency:"2ms", monthlyCost:"Rs.3,400",
    securityRule:"Strictly outbound TCP/UDP - no inbound ports open",
    whyPattern:"Enables private backend microservices to fetch third-party API payloads and OS security patches without exposing them.",
    failureImpact:"If NAT Gateway fails, private instances lose internet access. Mitigated by redundant NAT Gateways per AZ.",
    upstream:"Private Subnet Microservices (10.0.2.0/24)", downstream:"External APIs (Stripe, GitHub, Docker Hub)",
    threatMitigation:"One-way stateful translation: immune to unsolicited incoming connections from the internet."
  },
  alb: {
    title:"Application Load Balancer (ALB)", category:"Networking", categoryType:"networking", status:"Healthy",
    description:"Layer 7 (HTTP/HTTPS) load balancer routing requests across EC2 auto-scaling groups with path-based routing.",
    role:"High-Availability Ingress Traffic Distributor", latency:"3ms", monthlyCost:"Rs.2,600",
    securityRule:"Terminates TLS; forwards via HTTP to internal target groups",
    whyPattern:"Performs health checks on backend compute targets every 15s. Automatically redistributes requests away from failing instances.",
    failureImpact:"Deploys across multiple AZs (ap-south-1a and 1b) with automatic failover if a single zone degrades.",
    upstream:"Internet Gateway (IGW)", downstream:"Public Web Proxy EC2 & Private App Microservices",
    threatMitigation:"Drops malformed HTTP requests and invalid host headers before reaching internal application code."
  },
  "public-ec2": {
    title:"Public Web Proxy (2 Instances)", category:"Compute", categoryType:"compute", status:"Running",
    description:"Edge reverse proxy (Nginx/Envoy) serving public app interfaces and routing authenticated microservice calls into the VPC.",
    role:"Frontend Presentation & Reverse Proxy Tier", specs:"2 x t3.large (ap-south-1a & 1b)", monthlyCost:"Rs.4,200",
    securityRule:"Security Group: Ports 80/443 allowed strictly from ALB",
    whyPattern:"Acts as a DMZ isolation buffer so customer traffic never hits private database or backend business services directly.",
    failureImpact:"Auto-Scaling Group (min: 2, max: 6) instantly spins up a replacement instance if CPU spikes or an instance crashes.",
    upstream:"Application Load Balancer (ALB)", downstream:"Private Microservices (Port 8080) & Secrets Manager",
    threatMitigation:"Security Group only allows ingress from the ALB security group ID, blocking direct public port scans."
  },
  "private-ec2": {
    title:"Private App Microservices (3 Instances)", category:"Compute", categoryType:"compute", status:"Running",
    description:"Core business logic and API engines in containerized services inside deep private subnets - zero public IPs assigned.",
    role:"Backend Microservices Compute Tier", specs:"3 x t3.medium (Auto-scaling range 2-6)", monthlyCost:"Rs.8,400",
    securityRule:"No Public IP. Only reachable from Public Subnet EC2 via private VPC routing",
    whyPattern:"Completely unroutable from the public internet. Protects core proprietary logic and database credentials.",
    failureImpact:"Distributed across 3 AZs with target group health probes. A single server outage causes 0% dropped requests.",
    upstream:"Public Web Proxy EC2 (Port 8080)", downstream:"Amazon ElastiCache (Redis) & Amazon RDS (MySQL)",
    threatMitigation:"Instances lack public IP addresses and communicate strictly over private RFC-1918 internal IP ranges."
  },
  elasticache: {
    title:"Amazon ElastiCache (Redis)", category:"Database", categoryType:"database", status:"In-Sync",
    description:"Ultra-fast in-memory key-value store. Caches high-frequency DB queries, user sessions, and live leaderboard data.",
    role:"Sub-millisecond In-Memory Caching", specs:"cache.t3.medium (2-node cluster)", monthlyCost:"Rs.3,800",
    securityRule:"Port 6379 restricted to Private Microservices SG",
    whyPattern:"Absorbs 85% of read queries before they hit MySQL RDS, slashing database CPU and maintaining sub-5ms API response times.",
    failureImpact:"Redis Cluster failover automatically promotes read replica to primary in under 15 seconds if primary fails.",
    upstream:"Private Microservices EC2", downstream:"In-Memory Cache (RAM)",
    threatMitigation:"Protected by Redis AUTH password and strict VPC security group rule allowing Port 6379 strictly from app servers."
  },
  rds: {
    title:"Amazon RDS (MySQL Multi-AZ)", category:"Database", categoryType:"database", status:"Available",
    description:"Primary relational DB with synchronous Multi-AZ standby replica for zero-downtime automated failover.",
    role:"Persistent Structured Relational Storage", specs:"db.t3.large Multi-AZ (500 GB Storage)", monthlyCost:"Rs.18,900",
    securityRule:"Port 3306 locked down to Private App Subnet only",
    whyPattern:"Synchronous physical replication to standby in secondary AZ ensures zero data loss (RPO=0) and automatic DNS failover (RTO < 60s).",
    failureImpact:"Standby instance automatically promoted to primary if master AZ suffers power or network failure.",
    upstream:"Private Microservices EC2 (Port 3306)", downstream:"Encrypted EBS Storage (KMS AES-256)",
    threatMitigation:"Isolated in dedicated Database Subnet with no internet route. Port 3306 ingress blocked for all except microservice SG."
  },
  s3: {
    title:"Amazon S3 (customer-data-backup)", category:"Storage", categoryType:"storage", status:"Active",
    description:"Durable cloud object storage with automatic intelligent tiering moving cold files to Standard-IA & Glacier Deep Archive.",
    role:"Static Asset Repository & Compliance Backups", specs:"4,200 GB stored (Intelligent Tiering)", monthlyCost:"Rs.3,200",
    securityRule:"KMS AES-256 SSE, Public Access Blocked",
    whyPattern:"Provides 99.999999999% (11 9s) durability across minimum 3 AZs. VPC Endpoint enables direct S3 access without NAT charges.",
    failureImpact:"Geographically redundant across facilities; immune to single data center physical outages.",
    upstream:"Private Microservices & Automated Backup Jobs", downstream:"AWS Glacier Deep Archive (Lifecycle rule after 90 days)",
    threatMitigation:"S3 Block Public Access enforced. Bucket policy enforces TLS 1.2+ encryption in transit."
  },
  lambda: {
    title:"AWS Lambda (4 Serverless Functions)", category:"Serverless", categoryType:"serverless", status:"Active",
    description:"Serverless compute executing event-driven code responding to DB CDC triggers, S3 upload webhooks, and nightly cron routines.",
    role:"Event-Driven Async Automation", specs:"18,200 invocations / month", monthlyCost:"Rs.850",
    securityRule:"IAM Principle of Least Privilege execution roles",
    whyPattern:"Scales to zero when idle, saving compute costs compared to running dedicated background worker EC2 instances 24/7.",
    failureImpact:"Automatic retry mechanism with Dead Letter Queue (DLQ) in Amazon SQS if an async event execution fails.",
    upstream:"Amazon S3 Upload Events & CloudWatch Scheduled Events", downstream:"Amazon RDS & Amazon SNS Alerts",
    threatMitigation:"Ephemeral execution environment destroyed after each invocation; no persistent OS attack surface."
  },
  secrets: {
    title:"AWS Secrets Manager & KMS", category:"Security", categoryType:"security", status:"Encrypted",
    description:"Securely stores, rotates, and manages API keys, DB credentials, and encryption keys for microservices.",
    role:"Zero-Trust Credential & Cryptography Vault", securityRule:"Automated 60-day secret rotation, IAM-scoped policies",
    whyPattern:"Prevents hardcoded credentials in Git repositories. Applications query credentials at runtime via IAM role authentication.",
    failureImpact:"Locally cached with TTL in application memory so temporary network blips do not cause authentication errors.",
    upstream:"Private Microservices EC2 & AWS Lambda", downstream:"AWS KMS Customer Master Keys (CMKs)",
    threatMitigation:"Hardware Security Module (HSM) backing; all cryptographic operations logged to AWS CloudTrail for SOC2 compliance."
  },
  cloudwatch: {
    title:"Amazon CloudWatch & SNS Alarms", category:"Observability", categoryType:"observability", status:"Monitoring",
    description:"Continuous metrics collection, distributed tracing, error log streams, and automated Slack/Email paging alarms.",
    role:"Unified Telemetry, Metrics & Alerting", telemetry:"Real-time CPU/RAM/Network metric streams",
    whyPattern:"Gathers sub-minute telemetry from every tier into unified dashboards, driving Auto-Scaling and triggering incident escalations.",
    failureImpact:"CloudWatch alarms trigger SNS topic to page on-call engineers via PagerDuty / Slack before users detect degradation.",
    upstream:"All Cloud Resources (EC2, RDS, ALB, NAT, Lambda)", downstream:"Amazon SNS & Slack Engineering Alerts",
    threatMitigation:"Detects anomalous spikes in 4xx/5xx error rates and unauthorized IAM API calls in real time."
  }
};

/* ── Network data ── */
const networkData = [
  { name:"Public Subnet (10.0.1.0/24)", color:"#10B981", icon:Unlock, az:"ap-south-1a / 1b",
    routes:[{dest:"0.0.0.0/0",target:"igw-xxxxxxxx",type:"allow"},{dest:"10.0.0.0/16",target:"local",type:"allow"}],
    sgRules:[{port:"80/443",source:"0.0.0.0/0",action:"allow",desc:"HTTP/HTTPS from ALB"},{port:"22",source:"10.0.0.0/16",action:"allow",desc:"SSH from VPC only"},{port:"*",source:"0.0.0.0/0",action:"deny",desc:"All other inbound"}]
  },
  { name:"Private App Subnet (10.0.2.0/24)", color:"#38BDF8", icon:Lock, az:"ap-south-1a / 1b / 1c",
    routes:[{dest:"0.0.0.0/0",target:"nat-xxxxxxxx",type:"nat"},{dest:"10.0.0.0/16",target:"local",type:"allow"}],
    sgRules:[{port:"8080",source:"Public-Subnet-SG",action:"allow",desc:"App port from proxy tier"},{port:"6379",source:"Private-Subnet-SG",action:"allow",desc:"Redis internal"},{port:"3306",source:"Private-Subnet-SG",action:"allow",desc:"MySQL internal"},{port:"*",source:"0.0.0.0/0",action:"deny",desc:"Block all other"}]
  },
  { name:"Data / Serverless (VPC Endpoints)", color:"#C084FC", icon:Boxes, az:"ap-south-1a (Multi-AZ S3)",
    routes:[{dest:"S3 Gateway",target:"vpc-endpoint-s3",type:"allow"},{dest:"10.0.0.0/16",target:"local",type:"allow"}],
    sgRules:[{port:"443",source:"Private-Subnet-SG",action:"allow",desc:"S3/Lambda HTTPS endpoint"},{port:"*",source:"0.0.0.0/0",action:"deny",desc:"Block all public access"}]
  },
  { name:"Edge: Route53 & CloudFront", color:"#EC4899", icon:Globe, az:"Global (AWS Edge - 450+ PoPs)",
    routes:[{dest:"app.cloudpilot.io",target:"CloudFront Distribution",type:"allow"},{dest:"api.cloudpilot.io",target:"ALB (ap-south-1)",type:"allow"}],
    sgRules:[{port:"443",source:"0.0.0.0/0",action:"allow",desc:"HTTPS from internet"},{port:"WAF",source:"OWASP Rules",action:"deny",desc:"Block SQLi / XSS"}]
  },
  { name:"Security Plane: Secrets + KMS", color:"#EF4444", icon:ShieldCheck, az:"ap-south-1 (Regional)",
    routes:[{dest:"secretsmanager.ap-south-1",target:"VPC Endpoint",type:"allow"},{dest:"kms.ap-south-1",target:"VPC Endpoint",type:"allow"}],
    sgRules:[{port:"443",source:"Private-Subnet-SG",action:"allow",desc:"HTTPS from app microservices only"},{port:"*",source:"0.0.0.0/0",action:"deny",desc:"All other traffic blocked"}]
  },
  { name:"Observability: CloudWatch + SNS", color:"#F59E0B", icon:Activity, az:"ap-south-1 (Regional)",
    routes:[{dest:"monitoring.ap-south-1",target:"VPC Endpoint / Internet",type:"allow"}],
    sgRules:[{port:"443",source:"All Subnets",action:"allow",desc:"Metrics & log push from all tiers"},{port:"SNS",source:"CloudWatch Alarms",action:"allow",desc:"Slack / Email alerts on breach"}]
  }
];

const categories = [
  {id:"compute",    label:"Compute",      color:"#F97316", icon:Cpu},
  {id:"storage",    label:"Storage",      color:"#10B981", icon:HardDrive},
  {id:"database",   label:"Database",     color:"#38BDF8", icon:Database},
  {id:"networking", label:"Networking",   color:"#C084FC", icon:Network},
  {id:"security",   label:"Security",     color:"#EF4444", icon:Shield},
  {id:"serverless", label:"Serverless",   color:"#F59E0B", icon:Zap},
  {id:"observability",label:"Observability",color:"#EC4899",icon:Activity},
];

const REQ_FLOW = ["internet","route53","cloudfront","igw","alb","public-ec2","private-ec2","elasticache","rds"];
const THREAT   = ["internet","cloudfront","alb","public-ec2"];
const COST     = ["private-ec2","rds","nat-gateway","elasticache","s3"];

/* ── NodeCard ── */
function NodeCard({ nodeKey, icon:Icon, iconBg, iconColor, title, sub, badge, badgeColor, onClick, dimmed, simulation }) {
  const hl =
    (simulation === "request_flow" && REQ_FLOW.includes(nodeKey)) ||
    (simulation === "threat_path"  && THREAT.includes(nodeKey)) ||
    (simulation === "cost_hotspots"&& COST.includes(nodeKey));
  return (
    <div className={"rm-node-card"+(dimmed?" rm-dimmed":"")+(hl?" rm-highlighted":"")} onClick={onClick} title={"Inspect: "+title}>
      <div className="rm-node-icon" style={{background:iconBg}}><Icon size={18} color={iconColor}/></div>
      <div className="rm-node-labels">
        <div className="rm-node-title">{title}</div>
        {sub && <div className="rm-node-sub">{sub}</div>}
      </div>
      {badge && <span className="rm-node-badge" style={{background:badgeColor+"22",color:badgeColor,border:"1px solid "+badgeColor+"55"}}>{badge}</span>}
    </div>
  );
}

/* ── FlowArrow ── */
function FlowArrow({ label, color, animated }) {
  const c = color || "#C084FC";
  return (
    <div className="rm-flow-arrow-wrap">
      <div className="rm-flow-arrow-line" style={{borderColor:c}}>{animated&&<span className="rm-flow-pulse" style={{background:c}}/>}</div>
      {label && <span className="rm-flow-arrow-label" style={{color:c}}>{label}</span>}
      <div className="rm-flow-arrowhead" style={{borderTopColor:c}}/>
    </div>
  );
}

/* ── Main Page ── */
export default function ResourceMap() {
  const [activeView, setActiveView]       = useState("architecture");
  const [selectedCategory, setSelCat]    = useState("all");
  const [searchQuery, setSearch]          = useState("");
  const [selectedNode, setSelectedNode]  = useState(null);
  const [sim, setSim]                    = useState("none");
  const [drawerTab, setDrawerTab]        = useState("overview");
  const [exp, setExp]                    = useState({public:true,private:true,data:true});

  const isDimmed = (key) => {
    const n = nodeDetails[key];
    if (!n) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.category.toLowerCase().includes(q) && !n.description.toLowerCase().includes(q)) return true;
    }
    if (selectedCategory !== "all" && n.categoryType !== selectedCategory) return true;
    return false;
  };

  const openNode = (key) => { setSelectedNode(nodeDetails[key]||null); setDrawerTab("overview"); };
  const toggleExp = (k) => setExp(p => ({...p,[k]:!p[k]}));

  const SIM_INFO = {
    request_flow: {color:"#38BDF8", text:"Client > Route53/WAF > CloudFront > IGW > ALB > Microservices > Redis > MySQL RDS"},
    threat_path:  {color:"#EF4444", text:"Attack Surface: CloudFront WAF blocks SQLi/XSS. ALB terminates TLS. Private Subnet has 0 public IPs."},
    cost_hotspots:{color:"#10B981", text:"Cost Leaders: RDS Rs.18,900 (42%) | EC2 Rs.12,600 (28%) | ElastiCache Rs.3,800 (9%) | NAT Rs.3,400 (8%)"},
    none:         {color:"#64748B", text:"Click any node to open the architectural deep-dive inspector."}
  };

  return (
    <div className="dashboard-layout">
      <Sidebar/>
      <main className="dashboard-main rm-page-main">

        {/* Header */}
        <div className="rm-header">
          <div>
            <h1 className="rm-title">Resource Map</h1>
            <p className="rm-subtitle">Visualize your complete enterprise cloud infrastructure, service relationships and network topology.</p>
          </div>
          <div className="rm-view-toggle">
            <button className={"rm-view-btn"+(activeView==="architecture"?" rm-view-btn-active":"")} onClick={()=>{setActiveView("architecture");setSelectedNode(null);}}><Layers size={15}/> Architecture View</button>
            <button className={"rm-view-btn"+(activeView==="network"?" rm-view-btn-active":"")} onClick={()=>{setActiveView("network");setSelectedNode(null);}}><Table2 size={15}/> Network View</button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rm-filter-bar">
          <div className="rm-chips">
            <button className={"rm-chip"+(selectedCategory==="all"?" rm-chip-active":"")} onClick={()=>setSelCat("all")}>All Services</button>
            {categories.map(cat=>{
              const Icon=cat.icon; const active=selectedCategory===cat.id;
              return <button key={cat.id} className={"rm-chip"+(active?" rm-chip-active":"")} onClick={()=>setSelCat(p=>p===cat.id?"all":cat.id)} style={active?{borderColor:cat.color,color:cat.color}:{}}><Icon size={13} color={active?cat.color:"#64748B"}/> {cat.label}</button>;
            })}
          </div>
          <div className="rm-search">
            <Search size={14} color="#64748B" className="rm-search-icon"/>
            <input type="text" placeholder="Search services..." value={searchQuery} onChange={e=>setSearch(e.target.value)} className="rm-search-input"/>
          </div>
        </div>

        {/* Guided Explainer */}
        <div className="rm-explainer-bar">
          <div className="rm-explainer-btns">
            <span className="rm-explainer-label"><Compass size={13}/> Guided Explainer:</span>
            {[{id:"request_flow",e:"🚀",l:"Request Flow",c:"#38BDF8"},{id:"threat_path",e:"🛡️",l:"Threat Path",c:"#EF4444"},{id:"cost_hotspots",e:"💰",l:"Cost Hotspots",c:"#10B981"}].map(s=>(
              <button key={s.id} className={"rm-sim-btn"+(sim===s.id?" rm-sim-active":"")} style={sim===s.id?{borderColor:s.c,color:s.c,background:s.c+"18"}:{}} onClick={()=>setSim(p=>p===s.id?"none":s.id)}>{s.e} {s.l}</button>
            ))}
          </div>
          <div className="rm-explainer-text" style={{color:SIM_INFO[sim].color}}>{SIM_INFO[sim].text}</div>
        </div>

        {/* Main area */}
        <div className="rm-main-area">

          {/* Architecture View */}
          {activeView==="architecture" && (
            <div className={"rm-canvas"+(selectedNode?" rm-canvas-shrunk":"")}>
              <div className="rm-info-banner"><Info size={14} color="#B28DFF"/><span><strong>Architecture Flow:</strong> Internet - Route 53 + CloudFront WAF - IGW - ALB - Subnets - Data Layer. <strong>Click any node</strong> to deep-dive.</span></div>

              <div className="rm-tier rm-tier-center">
                <NodeCard nodeKey="internet" icon={Cloud} iconBg="rgba(192,132,252,0.18)" iconColor="#C084FC" title="Global Internet" sub="Public Users & APIs" badge="External" badgeColor="#C084FC" dimmed={isDimmed("internet")} simulation={sim} onClick={()=>openNode("internet")}/>
              </div>
              <FlowArrow color="#C084FC" animated={true} label="DNS + HTTPS"/>

              <div className="rm-tier rm-tier-two">
                <NodeCard nodeKey="route53" icon={Globe} iconBg="rgba(192,132,252,0.18)" iconColor="#C084FC" title="Route 53" sub="DNS & Geo-Routing" badge="100% SLA" badgeColor="#A855F7" dimmed={isDimmed("route53")} simulation={sim} onClick={()=>openNode("route53")}/>
                <NodeCard nodeKey="cloudfront" icon={Shield} iconBg="rgba(236,72,153,0.18)" iconColor="#EC4899" title="CloudFront + WAF" sub="CDN & DDoS Shield" badge="Protected" badgeColor="#EC4899" dimmed={isDimmed("cloudfront")} simulation={sim} onClick={()=>openNode("cloudfront")}/>
              </div>
              <FlowArrow color="#6366F1" animated={sim==="request_flow"} label="VPC Ingress"/>

              <div className="rm-tier rm-tier-center">
                <NodeCard nodeKey="igw" icon={Radio} iconBg="rgba(56,189,248,0.18)" iconColor="#38BDF8" title="Internet Gateway (IGW)" sub="VPC Public Ingress / Egress" dimmed={isDimmed("igw")} simulation={sim} onClick={()=>openNode("igw")}/>
              </div>
              <FlowArrow color="#B28DFF" animated={sim==="request_flow"} label="Layer 7 - Load Balanced"/>

              <div className="rm-vpc-box">
                <div className="rm-vpc-label"><Network size={14} color="#C084FC"/><span>Production VPC (ap-south-1) - CIDR: 10.0.0.0/16 - 3 AZs</span></div>

                <div className="rm-tier rm-tier-center rm-alb-row">
                  <NodeCard nodeKey="alb" icon={Layers} iconBg="rgba(178,141,255,0.18)" iconColor="#B28DFF" title="Application Load Balancer (ALB)" sub="Layer 7 - SSL Offload - Health Checks" badge="Multi-AZ" badgeColor="#B28DFF" dimmed={isDimmed("alb")} simulation={sim} onClick={()=>openNode("alb")}/>
                </div>

                <div className="rm-subnets-row">
                  {/* Public Subnet */}
                  <div className="rm-subnet rm-subnet-public">
                    <div className="rm-subnet-header" onClick={()=>toggleExp("public")}>
                      <div className="rm-subnet-badge-label" style={{color:"#10B981"}}><Unlock size={12}/> Public Subnet <code className="rm-cidr">10.0.1.0/24</code></div>
                      {exp.public?<ChevronUp size={14} color="#64748B"/>:<ChevronDown size={14} color="#64748B"/>}
                    </div>
                    {exp.public && <div className="rm-subnet-body">
                      <NodeCard nodeKey="public-ec2" icon={Server} iconBg="#F97316" iconColor="#FFF" title="EC2 Web Proxy" sub="2x t3.large - ASG" badge="Rs.4,200/mo" badgeColor="#F97316" dimmed={isDimmed("public-ec2")} simulation={sim} onClick={()=>openNode("public-ec2")}/>
                      <NodeCard nodeKey="nat-gateway" icon={Radio} iconBg="#F59E0B" iconColor="#FFF" title="NAT Gateway" sub="Outbound Only" badge="Rs.3,400/mo" badgeColor="#F59E0B" dimmed={isDimmed("nat-gateway")} simulation={sim} onClick={()=>openNode("nat-gateway")}/>
                    </div>}
                  </div>

                  {/* Private Subnet */}
                  <div className="rm-subnet rm-subnet-private">
                    <div className="rm-subnet-header" onClick={()=>toggleExp("private")}>
                      <div className="rm-subnet-badge-label" style={{color:"#38BDF8"}}><Lock size={12}/> Private Subnet <code className="rm-cidr">10.0.2.0/24 - No Public IP</code></div>
                      {exp.private?<ChevronUp size={14} color="#64748B"/>:<ChevronDown size={14} color="#64748B"/>}
                    </div>
                    {exp.private && <div className="rm-subnet-body">
                      <NodeCard nodeKey="private-ec2" icon={Server} iconBg="#F97316" iconColor="#FFF" title="App Microservices" sub="3x t3.medium - Auto-scale" badge="Rs.8,400/mo" badgeColor="#F97316" dimmed={isDimmed("private-ec2")} simulation={sim} onClick={()=>openNode("private-ec2")}/>
                      <div className="rm-inner-row">
                        <NodeCard nodeKey="elasticache" icon={Zap} iconBg="#10B981" iconColor="#FFF" title="ElastiCache Redis" sub="2-node cluster" badge="Rs.3,800/mo" badgeColor="#10B981" dimmed={isDimmed("elasticache")} simulation={sim} onClick={()=>openNode("elasticache")}/>
                        <NodeCard nodeKey="rds" icon={Database} iconBg="#0284C7" iconColor="#FFF" title="RDS MySQL Multi-AZ" sub="500 GB - Standby" badge="Rs.18,900/mo" badgeColor="#0284C7" dimmed={isDimmed("rds")} simulation={sim} onClick={()=>openNode("rds")}/>
                      </div>
                    </div>}
                  </div>

                  {/* Data & Serverless */}
                  <div className="rm-subnet rm-subnet-data">
                    <div className="rm-subnet-header" onClick={()=>toggleExp("data")}>
                      <div className="rm-subnet-badge-label" style={{color:"#CBD5E1"}}><Boxes size={12}/> Data & Serverless <code className="rm-cidr">VPC Endpoints</code></div>
                      {exp.data?<ChevronUp size={14} color="#64748B"/>:<ChevronDown size={14} color="#64748B"/>}
                    </div>
                    {exp.data && <div className="rm-subnet-body">
                      <NodeCard nodeKey="s3" icon={HardDrive} iconBg="#10B981" iconColor="#FFF" title="Amazon S3" sub="4,200 GB - Intelligent Tiering" badge="Rs.3,200/mo" badgeColor="#10B981" dimmed={isDimmed("s3")} simulation={sim} onClick={()=>openNode("s3")}/>
                      <NodeCard nodeKey="lambda" icon={Zap} iconBg="#8B5CF6" iconColor="#FFF" title="AWS Lambda" sub="4 Functions - 18K inv/mo" badge="Rs.850/mo" badgeColor="#8B5CF6" dimmed={isDimmed("lambda")} simulation={sim} onClick={()=>openNode("lambda")}/>
                    </div>}
                  </div>
                </div>

                <div className="rm-foundation">
                  <div className="rm-foundation-card" onClick={()=>openNode("secrets")}><Key size={15} color="#EF4444"/><div><div className="rm-foundation-name">AWS Secrets Manager & KMS</div><div className="rm-foundation-sub">Zero-Trust Encrypted Vault</div></div></div>
                  <div className="rm-foundation-card" onClick={()=>openNode("cloudwatch")}><Activity size={15} color="#EC4899"/><div><div className="rm-foundation-name">CloudWatch & SNS</div><div className="rm-foundation-sub">Real-Time Telemetry & Alarms</div></div></div>
                </div>
              </div>

              <div className="rm-legend">
                <span className="rm-legend-label">Traffic Flow:</span>
                {[{color:"#C084FC",label:"DNS/CDN"},{color:"#38BDF8",label:"Load Balanced"},{color:"#10B981",label:"Cache Hit"},{color:"#F59E0B",label:"NAT Egress"}].map(l=>(
                  <span key={l.label} className="rm-legend-item"><span className="rm-legend-dot" style={{background:l.color}}/>{l.label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Network View */}
          {activeView==="network" && (
            <div className="rm-network-view">
              <div className="rm-network-intro">
                <h2 className="rm-network-title">Network Security & Routing Tables</h2>
                <p className="rm-network-sub">VPC: <code>10.0.0.0/16</code> - Region: <code>ap-south-1</code> - Availability Zones: 3</p>
                <div className="rm-legend" style={{marginTop:"0.75rem"}}>
                  {[{color:"#10B981",label:"Public Subnet"},{color:"#38BDF8",label:"Private App Subnet"},{color:"#C084FC",label:"Data/Serverless"},{color:"#EC4899",label:"Edge/CDN"},{color:"#EF4444",label:"Security Plane"},{color:"#F59E0B",label:"Observability"}].map(l=>(
                    <span key={l.label} className="rm-legend-item"><span className="rm-legend-dot" style={{background:l.color}}/>{l.label}</span>
                  ))}
                </div>
              </div>
              <div className="rm-network-grid">
                {networkData.map(subnet=>{
                  const Icon=subnet.icon;
                  return (
                    <div key={subnet.name} className="rm-net-card">
                      <div className="rm-net-card-header">
                        <div className="rm-net-icon" style={{background:subnet.color+"22",border:"1px solid "+subnet.color+"55"}}><Icon size={16} color={subnet.color}/></div>
                        <div><div className="rm-net-name" style={{color:subnet.color}}>{subnet.name}</div><div className="rm-net-az">{subnet.az}</div></div>
                      </div>
                      <div className="rm-net-section-label"><ArrowRight size={10}/> Routing Table</div>
                      <table className="rm-net-table"><thead><tr><th>Destination</th><th>Target</th><th>Type</th></tr></thead><tbody>
                        {subnet.routes.map((r,i)=><tr key={i}><td>{r.dest}</td><td>{r.target}</td><td><span className={"rm-route-badge "+(r.type==="nat"?"rm-badge-nat":"rm-badge-allow")}>{r.type==="nat"?"NAT":"ACTIVE"}</span></td></tr>)}
                      </tbody></table>
                      <div className="rm-net-section-label" style={{marginTop:"0.75rem"}}><Shield size={10}/> Security Group Rules</div>
                      <table className="rm-net-table"><thead><tr><th>Port</th><th>Source</th><th>Action</th></tr></thead><tbody>
                        {subnet.sgRules.map((r,i)=><tr key={i} title={r.desc}><td>{r.port}</td><td className="rm-net-source">{r.source}</td><td><span className={"rm-route-badge "+(r.action==="allow"?"rm-badge-allow":"rm-badge-deny")}>{r.action.toUpperCase()}</span></td></tr>)}
                      </tbody></table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drawer */}
          {selectedNode && activeView==="architecture" && (
            <div className="rm-drawer">
              <div className="rm-drawer-header">
                <div><span className="rm-drawer-category">{selectedNode.category}</span><h3 className="rm-drawer-title">{selectedNode.title}</h3></div>
                <button className="rm-drawer-close" onClick={()=>setSelectedNode(null)}><X size={16}/></button>
              </div>
              <div className="rm-drawer-tabs">
                {[{id:"overview",label:"Overview"},{id:"why",label:"Rationale"},{id:"flow",label:"Topology"},{id:"resilience",label:"Resilience"}].map(tab=>(
                  <button key={tab.id} className={"rm-drawer-tab"+(drawerTab===tab.id?" rm-drawer-tab-active":"")} onClick={()=>setDrawerTab(tab.id)}>{tab.label}</button>
                ))}
              </div>
              <div className="rm-drawer-body">
                <div className="rm-chip-row">
                  <span className="rm-status-chip"><CheckCircle size={10}/> {selectedNode.status}</span>
                  {selectedNode.latency && <span className="rm-latency-chip">Latency: {selectedNode.latency}</span>}
                  {selectedNode.monthlyCost && <span className="rm-cost-chip">Cost: {selectedNode.monthlyCost}/mo</span>}
                </div>
                {drawerTab==="overview" && <>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">What is this component?</h4><p className="rm-drawer-text">{selectedNode.description}</p></div>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Architectural Role</h4><p className="rm-drawer-role">{selectedNode.role}</p></div>
                  {selectedNode.specs && <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Specifications</h4><div className="rm-spec-box">{selectedNode.specs}</div></div>}
                  {selectedNode.telemetry && <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Live Metrics</h4><div className="rm-spec-box">{selectedNode.telemetry}</div></div>}
                </>}
                {drawerTab==="why" && <>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Why This Pattern?</h4><p className="rm-drawer-text">{selectedNode.whyPattern||"Implements decoupled high-availability multi-tier architecture per AWS Well-Architected Framework."}</p></div>
                  <div className="rm-well-arch-box"><h4 style={{fontSize:"0.78rem",color:"#B28DFF",marginBottom:6,fontWeight:700}}>Well-Architected Pillar</h4><p style={{fontSize:"0.74rem",color:"#CBD5E1",lineHeight:1.55}}><strong>Reliability & Performance:</strong> Decouples compute from persistence. Prevents traffic surges from overwhelming downstream databases.</p></div>
                </>}
                {drawerTab==="flow" && <>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Upstream Callers</h4><div className="rm-flow-box rm-flow-blue">{selectedNode.upstream||"Public Client Ingress"}</div></div>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Downstream Dependencies</h4><div className="rm-flow-box rm-flow-green">{selectedNode.downstream||"Database & Persistence Layer"}</div></div>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Network Tier</h4><p className="rm-drawer-role">{selectedNode.categoryType==="networking"?"Edge / Perimeter Gateway":selectedNode.categoryType==="compute"?"Compute / Application DMZ":selectedNode.categoryType==="database"?"Private Isolated Database Tier (No Internet Access)":"Regional Managed Serverless Plane"}</p></div>
                </>}
                {drawerTab==="resilience" && <>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Failure Impact & Blast Radius</h4><p className="rm-drawer-text" style={{color:"#FCA5A5"}}>{selectedNode.failureImpact||"Resilient multi-AZ failover with automated health probes ensures seamless failover."}</p></div>
                  <div className="rm-drawer-section"><h4 className="rm-drawer-sh">Defense-in-Depth</h4><div className="rm-sec-rule"><Shield size={12} color="#10B981"/><span>{selectedNode.securityRule}</span></div><p className="rm-drawer-text" style={{marginTop:8}}>{selectedNode.threatMitigation||"Enforces least-privilege access, encrypted transport, and VPC network boundary controls."}</p></div>
                </>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
