/* filepath: frontend/src/components/dashboard/Portfolio3D/Portfolio3D.js */
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Html } from '@react-three/drei';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import './Portfolio3D.css';

const Portfolio3D = ({ portfolioData = [] }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewMode, setViewMode] = useState('sphere'); // 'sphere', 'bar', 'pie'

  return (
    <div className="portfolio-3d-container">
      <div className="portfolio-3d-controls">
        <motion.div 
          className="view-mode-selector"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {['sphere', 'bar', 'pie'].map(mode => (
            <button
              key={mode}
              className={`mode-btn ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </motion.div>
      </div>

      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          style={{ background: 'radial-gradient(circle, #0a0a0a 0%, #1a1a2e 100%)' }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={1}
            castShadow
          />
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />

          {viewMode === 'sphere' && (
            <SphereVisualization 
              data={portfolioData} 
              onSelect={setSelectedAsset}
            />
          )}
          
          {viewMode === 'bar' && (
            <BarVisualization 
              data={portfolioData} 
              onSelect={setSelectedAsset}
            />
          )}
          
          {viewMode === 'pie' && (
            <PieVisualization 
              data={portfolioData} 
              onSelect={setSelectedAsset}
            />
          )}
          
          <StarField />
        </Canvas>
      </div>

      {selectedAsset && (
        <AssetDetailsPanel 
          asset={selectedAsset} 
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
};

// 3D Sphere Visualization Component
const SphereVisualization = ({ data, onSelect }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {data.map((asset, index) => (
        <AssetSphere
          key={asset.symbol}
          asset={asset}
          position={[
            Math.sin((index / data.length) * Math.PI * 2) * 4,
            Math.cos((index / data.length) * Math.PI * 2) * 2,
            Math.cos((index / data.length) * Math.PI * 4) * 3
          ]}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
};

// Individual Asset Sphere
const AssetSphere = ({ asset, position, onSelect }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const size = Math.max(0.5, (asset.value / 10000) * 2);
  const color = asset.change >= 0 ? '#2ecc71' : '#e74c3c';
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      
      if (hovered) {
        meshRef.current.scale.setScalar(1.2);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect(asset)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[0, size + 0.5, 0]}
        >
          {asset.symbol}
        </Text>
      </Billboard>
      
      {hovered && (
        <Html distanceFactor={10}>
          <div className="asset-tooltip">
            <div className="tooltip-header">{asset.symbol}</div>
            <div className="tooltip-value">${asset.value.toLocaleString()}</div>
            <div className={`tooltip-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// 3D Bar Chart Visualization
const BarVisualization = ({ data, onSelect }) => {
  return (
    <group>
      {data.map((asset, index) => (
        <AssetBar
          key={asset.symbol}
          asset={asset}
          position={[(index - data.length / 2) * 2, 0, 0]}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
};

const AssetBar = ({ asset, position, onSelect }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const height = Math.max(0.5, (asset.value / 5000));
  const color = asset.change >= 0 ? '#2ecc71' : '#e74c3c';
  
  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.y = height * 1.1;
    } else if (meshRef.current) {
      meshRef.current.scale.y = height;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect(asset)}
      >
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
      
      <Text
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {asset.symbol}
      </Text>
    </group>
  );
};

// Star Field Background
const StarField = () => {
  const starsRef = useRef();
  
  const stars = new Array(1000).fill().map(() => ({
    position: [
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ]
  }));
  
  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={starsRef}>
      {stars.map((star, i) => (
        <mesh key={i} position={star.position}>
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
};

// Asset Details Panel
const AssetDetailsPanel = ({ asset, onClose }) => {
  return (
    <motion.div
      className="asset-details-panel"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
    >
      <div className="panel-header">
        <h3>{asset.symbol}</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="detail-row">
          <span>Current Value:</span>
          <span>${asset.value.toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>24h Change:</span>
          <span className={asset.change >= 0 ? 'positive' : 'negative'}>
            {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
          </span>
        </div>
        <div className="detail-row">
          <span>Portfolio %:</span>
          <span>{asset.percentage}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Portfolio3D;