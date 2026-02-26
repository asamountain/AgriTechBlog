import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Cpu, Globe, Database, Zap, Milestone } from 'lucide-react';

interface JourneyNode {
  year: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const milestones: JourneyNode[] = [
  {
    year: "2012-2015",
    title: "The Industrial Foundation",
    description: "Built the mental models for system architecture through traditional manufacturing and engineering.",
    icon: <Database className="w-6 h-6" />,
    color: "bg-blue-600"
  },
  {
    year: "2016-2020",
    title: "Digital Awakening",
    description: "Deep immersion into full-stack development and complex communication protocols.",
    icon: <Zap className="w-6 h-6" />,
    color: "bg-yellow-500"
  },
  {
    year: "2021-2023",
    title: "IoT & Field Systems",
    description: "Deploying and ensuring the reliability of sensors and nodes in harsh agricultural environments.",
    icon: <Cpu className="w-6 h-6" />,
    color: "bg-green-600"
  },
  {
    year: "2024",
    title: "Soil to Silicon",
    description: "Orchestrating the multi-layered flow of data from earth to cloud at iocrops.",
    icon: <Sprout className="w-6 h-6" />,
    color: "bg-forest-green"
  },
  {
    year: "Future",
    title: "Sustainable Abundance",
    description: "Leading the next generation of Tech Farms where nature and code harmonize.",
    icon: <Globe className="w-6 h-6" />,
    color: "bg-indigo-600"
  }
];

export default function VisualJourney() {
  return (
    <div className="relative py-20 overflow-hidden">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 hidden md:block" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
          {milestones.map((node, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center group"
            >
              {/* Year Bubble */}
              <div className="mb-6 z-10">
                <div className={`w-16 h-16 rounded-full ${node.color} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 ring-4 ring-white`}>
                  {node.icon}
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-serif font-bold text-gray-400 group-hover:text-forest-green transition-colors">
                  {node.year}
                </div>
              </div>

              {/* Content Card */}
              <motion.div 
                className="text-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full"
                whileHover={{ y: -5 }}
              >
                <h3 className="font-bold text-gray-900 mb-2">{node.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {node.description}
                </p>
              </motion.div>

              {/* Current Status Pulse for the last 'active' node */}
              {node.year === "2024" && (
                <div className="absolute -bottom-4">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-forest-green"></span>
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 text-sm italic">
        Hover over each milestone to see the journey evolve
      </div>
    </div>
  );
}
