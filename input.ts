import { Models, Provider, run } from "./app";

const provider: Provider = Provider.Ollama;
const model: Models = Models.AllMinilm;
const input: string[] = [
  "Senior Software Engineer",
  "Senior Software Engineer - MetaMask (Transaction Lifecycle)",
  "Paramedic",
  "Architect",
  "Surgeon",
  "Music Producer",
  "Marketer",
  "Doctor",
  "Dentist",
  "Electrician",
  "Bricklayer",
  "Plumber",
  "Senior Software Engineer",
  "Software Engineer, Document Databases",
  "Python Engineer",
  "JavaScript Rockstar",
  "Senior DevOps Enginneer",
  "1 million x programmer",
  "Cab Driver",
  "Tailor",
  "Class Teacher",
  "Machine Learning Engineer",
  "Trader",
  "Senior Software Engineer - Data, Backend",
  "Hardware Engineer",
  "Embedded API Software Engineer",
  "Fullstack Engineer, Analyze: Analytics Instrumentation",
  "Senior Software Developer - Insurance Integrations",
  "Staff Engineer, Audiences & Customer Data Platform",
  "Ruby On Rails Developer Remote",
];

run(provider, model, input);
