import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import demoData from '../data/demoData';
import { calculateSimulation } from '../utils/simulationEngine';
import SimulationModeBanner from '../components/simulator/SimulationModeBanner';
import CurrentEnvironmentCard from '../components/simulator/CurrentEnvironmentCard';
import PathwayVisualizer from '../components/simulator/PathwayVisualizer';
import ScenarioPresets from '../components/simulator/ScenarioPresets';
import ResourceConfigurator from '../components/simulator/ResourceConfigurator';
import SimulationResultCard from '../components/simulator/SimulationResultCard';
import CostComparisonBars from '../components/simulator/CostComparisonBars';
import CostProjectionChart from '../components/simulator/CostProjectionChart';
import CostBreakdownChart from '../components/simulator/CostBreakdownChart';
import CostBreakdownTable from '../components/simulator/CostBreakdownTable';
import ScenarioComparisonMatrix from '../components/simulator/ScenarioComparisonMatrix';
import AIScenarioInsightCard from '../components/simulator/AIScenarioInsightCard';

const Simulator = () => {
  const location = useLocation();
  const baselineResources = useMemo(() => demoData.resources || [], []);
  
  // State for sandbox modifications
  const [scenarioMods, setScenarioMods] = useState({});
  const [addedResources, setAddedResources] = useState([]);
  const [globalOpts, setGlobalOpts] = useState({ pricingModel: 'On-Demand', globalWorkload: 100 });
  const [activePresetKey, setActivePresetKey] = useState(null);
  const [activePathwayKey, setActivePathwayKey] = useState(null);
  const [activeScenarioName, setActiveScenarioName] = useState('');
  const [savedScenarios, setSavedScenarios] = useState([
    {
      name: 'AI Recommended Sizing',
      simulatedMonthlyCost: 42900,
      monthlyDifference: -5600,
      annualSavings: 67200,
      riskLevel: 'Low',
      scenarioMods: { 'i-001': { instanceType: 't3.medium' } }
    },
    {
      name: 'Growth Expansion (+50% Traffic)',
      simulatedMonthlyCost: 59900,
      monthlyDifference: 11400,
      annualSavings: -136800,
      riskLevel: 'Medium',
      scenarioMods: { 'i-001': { quantity: 4 } }
    }
  ]);
  const [isRoadmapAdded, setIsRoadmapAdded] = useState(false);

  // Check URL query param e.g. /simulator?preset=ai-recommended or /simulator?scenario=downsize-ec2
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const presetParam = params.get('preset') || params.get('scenario');
    if (presetParam) {
      applyPreset(presetParam);
    }
  }, [location]);

  // Handle resource modification updates
  const handleUpdateMod = (id, newMods) => {
    setScenarioMods(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...newMods }
    }));
    setActivePresetKey(null);
    setActivePathwayKey(null);
    setIsRoadmapAdded(false);
  };

  // Handle adding virtual resource
  const handleAddResource = (newRes) => {
    setAddedResources(prev => [...prev, newRes]);
    setIsRoadmapAdded(false);
  };

  // Handle removing added virtual resource
  const handleRemoveAddedResource = (id) => {
    setAddedResources(prev => prev.filter(r => r.id !== id));
  };

  // Reset sandbox back to original baseline
  const handleReset = () => {
    setScenarioMods({});
    setAddedResources([]);
    setGlobalOpts({ pricingModel: 'On-Demand', globalWorkload: 100 });
    setActivePresetKey(null);
    setActivePathwayKey(null);
    setActiveScenarioName('');
    setIsRoadmapAdded(false);
  };

  // Apply one-click preset scenarios
  const applyPreset = (key) => {
    setActivePresetKey(key);
    setActivePathwayKey(key);
    setIsRoadmapAdded(false);

    if (key === 'ai-recommended' || key === 'downsize' || key === 'downsize-ec2') {
      setScenarioMods({
        'i-001': { instanceType: 't3.medium' },
        's3-001': { storageClass: 'Infrequent Access' }
      });
      setGlobalOpts({ pricingModel: 'On-Demand' });
      setActiveScenarioName('AI Recommended Optimization');
    } else if (key === 'scale-growth' || key === 'reduce-count') {
      setScenarioMods({
        'i-001': { quantity: 4 },
        'rds-001': { storageGB: 1000 }
      });
      setGlobalOpts({ pricingModel: 'On-Demand' });
      setActiveScenarioName('Scale for Growth (+50%)');
    } else if (key === 'aggressive-cut' || key === 'optimize-storage') {
      setScenarioMods({
        'i-001': { instanceType: 't3.small' },
        's3-001': { storageClass: 'Glacier Deep Archive' },
        'lambda-001': { invocations: 10000 }
      });
      setGlobalOpts({ pricingModel: 'On-Demand' });
      setActiveScenarioName('Aggressive Waste Reduction');
    } else if (key === 'reserved-model' || key === 'pricing-model') {
      setScenarioMods({});
      setGlobalOpts({ pricingModel: '1-Yr Reserved' });
      setActiveScenarioName('1-Yr Reserved Commit');
    }
  };

  // Calculate live results via simulation engine
  const results = useMemo(() => {
    return calculateSimulation(baselineResources, scenarioMods, { ...globalOpts, addedResources });
  }, [baselineResources, scenarioMods, globalOpts, addedResources]);

  // Check if sandbox has any modifications
  const isModified = useMemo(() => {
    return Object.keys(scenarioMods).length > 0 || addedResources.length > 0 || globalOpts.pricingModel !== 'On-Demand';
  }, [scenarioMods, addedResources, globalOpts]);

  // Save current scenario locally
  const handleSaveScenario = () => {
    const name = activeScenarioName || `Custom Scenario ${savedScenarios.length + 1}`;
    const newScenario = {
      name,
      simulatedMonthlyCost: results.simulatedMonthlyCost,
      monthlyDifference: results.monthlyDifference,
      annualSavings: results.annualSavings,
      riskLevel: results.riskLevel,
      scenarioMods: { ...scenarioMods },
      globalOpts: { ...globalOpts }
    };
    setSavedScenarios(prev => [...prev, newScenario]);
    alert(`Scenario "${name}" saved to comparison matrix!`);
  };

  // Load a saved scenario
  const handleLoadScenario = (sc) => {
    setScenarioMods(sc.scenarioMods || {});
    setGlobalOpts(sc.globalOpts || { pricingModel: 'On-Demand' });
    setActiveScenarioName(sc.name);
    setIsRoadmapAdded(false);
  };

  // Delete saved scenario
  const handleDeleteScenario = (index) => {
    setSavedScenarios(prev => prev.filter((_, i) => i !== index));
  };

  // Add to Roadmap handler
  const handleAddToRoadmap = () => {
    setIsRoadmapAdded(true);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main simulator-page-main">
        {/* Top Header Banner */}
        <SimulationModeBanner 
          dataSource="Demo Environment"
          isModified={isModified}
          onReset={handleReset}
          onSaveScenario={handleSaveScenario}
          activeScenarioName={activeScenarioName}
        />

        {/* Current Environment Overview */}
        <CurrentEnvironmentCard 
          baselineCost={demoData.summary.monthlyCost || 48500}
          resources={baselineResources}
        />

        {/* Centerpiece: Interactive Category-Based What-If Architecture Tree */}
        <PathwayVisualizer 
          onSelectPathway={applyPreset}
          activePathwayKey={activePathwayKey}
          onAddToRoadmap={handleAddToRoadmap}
          isRoadmapAdded={isRoadmapAdded}
        />

        {/* Spacious Visual Analytics: Cost Projection & Cost Breakdown Dual Boxes */}
        <div className="sim-charts-grid">
          <CostProjectionChart 
            currentCost={results.currentMonthlyCost}
            simulatedCost={results.simulatedMonthlyCost}
          />
          <CostBreakdownChart 
            currentCost={results.currentMonthlyCost}
            simulatedCost={results.simulatedMonthlyCost}
          />
        </div>

        {/* AI Scenario Insight */}
        <div className="mt-4">
          <AIScenarioInsightCard 
            aiInsight={results.aiInsight}
            riskRationale={results.riskRationale}
            riskLevel={results.riskLevel}
          />
        </div>

        {/* Saved Scenarios Comparison Matrix */}
        <div className="mt-4">
          <ScenarioComparisonMatrix 
            savedScenarios={savedScenarios}
            onLoadScenario={handleLoadScenario}
            onDeleteScenario={handleDeleteScenario}
          />
        </div>
      </main>
    </div>
  );
};

export default Simulator;
