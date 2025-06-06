import React from 'react';
import Particles from '@tsparticles/react';

const ParticleBackground: React.FC = () => {
  return (
    <Particles
      id="tsparticles"
      options={{
        fullScreen: {
          enable: true,
          zIndex: -1
        },
        fpsLimit: 60,
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              width: 800
            }
          },
          color: {
            value: ["#8b5cf6", "#6d28d9", "#3b82f6", "#06b6d4", "#22d3ee"],
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: { min: 0.3, max: 0.7 }
          },
          size: {
            value: { min: 1, max: 4 }
          },
          links: {
            enable: true,
            distance: 150,
            color: "#a78bfa",
            opacity: 0.2,
            width: 1
          },
          move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: false,
            straight: false,
            outModes: { default: "out" },
            attract: {
              enable: false,
              rotate: { x: 600, y: 1200 }
            }
          }
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab"
            },
            onClick: {
              enable: true,
              mode: "push"
            }
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.5
              }
            },
            push: {
              quantity: 4
            },
          }
        },
        detectRetina: true
      }}
    />
  );
};

export default ParticleBackground; 