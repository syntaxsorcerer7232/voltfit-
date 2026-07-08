import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface KineticVolumeBarProps {
  value: number; // 0 to 100
  onChange: (value: number) => void;
  height?: number;
}

const KineticVolumeBar: React.FC<KineticVolumeBarProps> = ({ 
  value, 
  onChange, 
  height = 24 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas as any).getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;

varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = m * p * 2.0 + u_time * 0.8;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = v_texCoord;
    
    float n = fbm(uv * vec2(6.0, 3.0) - vec2(u_time * 2.0, 0.0));
    
    float fire = (1.2 - uv.y) * 1.2; 
    fire += n * 0.7;
    
    fire = smoothstep(0.35, 0.95, fire);
    
    vec3 color1 = vec3(0.0, 0.15, 0.05);
    vec3 color2 = vec3(0.1, 0.8, 0.2);
    vec3 color3 = vec3(0.8, 1.0, 0.6);
    
    vec3 finalColor = mix(color1, color2, fire);
    finalColor = mix(finalColor, color3, pow(fire, 3.0));
    
    float alpha = fire * smoothstep(1.0, 0.8, uv.y);
    
    gl_FragColor = vec4(finalColor * alpha, alpha);
}`;

    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram();
    if (!prog) return;
    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;
    
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    const syncSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = rect.width;
        const h = 28; // leak height
        if (canvas.width !== w) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      }
    };

    let animationFrame: number;
    const render = (t: number) => {
      syncSize();
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-4 bg-[#171717] border border-[#262626] rounded-sm overflow-visible cursor-pointer group"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newVal = Math.max(0, Math.min(100, (x / rect.width) * 100));
        onChange(newVal);
      }}
      onMouseMove={(e) => {
        if (e.buttons === 1) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newVal = Math.max(0, Math.min(100, (x / rect.width) * 100));
          onChange(newVal);
        }
      }}
    >
      {/* Progress Shader Container - Reveal Effect */}
      <div 
        className="absolute top-[-12px] left-0 w-full h-[28px] overflow-visible pointer-events-none"
      >
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full" 
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        />
      </div>
      
      {/* Interaction overlay */}
      <input 
        type="range" 
        min="0" max="100" 
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  );
};

export default KineticVolumeBar;
