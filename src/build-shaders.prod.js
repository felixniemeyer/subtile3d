import { createProgramFromSources } from './3rd-party/shader-program-build-tool.js'

import vsGenPlasma from './shader/vs-gen-plasma.glsl'
import fsGenPlasma from './shader/fs-gen-plasma.glsl'

import vsGenGeo from './shader/vs-gen-geo.glsl'
import fsGenGeo from './shader/fs-gen-geo.glsl'

import vsRenderGeo from './shader/vs-render-geo.glsl'
import fsRenderGeo from './shader/fs-render-geo.glsl'

import vsDbgTex from './shader/vs-dbg-tex.glsl'
import fsDbgTex from './shader/fs-dbg-tex.glsl'


// import shader pieces and combine them together for transitions

const getUniformLocations = (gl, program, uniformNames) => {
  var uniformMap = {}
  for(var i = 0; i < uniformNames.length; i++) {
    var uName = uniformNames[i] 
    uniformMap[uName] = gl.getUniformLocation(program, uName)
  }
  return uniformMap
}

export default function buildShaders(gl) {
  var progs = {}
  var uniLocs = {}

  console.log('building shader', 'genPlasma')
  progs.genPlasma = createProgramFromSources(gl, [
      vsGenPlasma.sourceCode, 
      fsGenPlasma.sourceCode
    ]
  )
  uniLocs.genPlasma = getUniformLocations(
    gl, progs.genPlasma, [
      'time',
      'turbulence'
    ]
  )

  console.log('building shader', 'genGeo')
  progs.genGeo = createProgramFromSources(gl, [
      vsGenGeo.sourceCode, 
      fsGenGeo.sourceCode
    ]
  )
  uniLocs.genGeo = getUniformLocations(
    gl, progs.genGeo, [
      'plasmaTex',
      'quadCountSqrt',
      'quadCountSqrtInverse',
      'vertexCountSqrtInverse',
      'flatness',
      'cameraSpread', 
      'camera',
      'shape',
      'prismSide00A',
      'prismSide00B',
      'prismSide01A',
      'prismSide01B',
      'prismSide10A',
      'prismSide10B',
      'prismSide11A',
      'prismSide11B'
    ]
  )

  console.log('building shader', 'renderGeo')
  progs.renderGeo = createProgramFromSources(gl, [
      vsRenderGeo.sourceCode, 
      fsRenderGeo.sourceCode
    ]
  )
  uniLocs.renderGeo = getUniformLocations(
    gl, progs.renderGeo, [
      // vs
      'quadCountSqrt',
      'quadCountSqrtInverse',
      'geoTexV0', 
      'geoTexV1',
      'geoTexV2',
      'geoTexLookAt',
      //fs
      'pixelSize',
      'borderSize', 
      'borderZWeight', 
      'cells',
      'cellSize',
      'fog',
      'resolutionInverse'
    ]
  )

  console.log('building shader', 'dbgTex')
  progs.dbgTex = createProgramFromSources(gl, [
      vsDbgTex.sourceCode, 
      fsDbgTex.sourceCode
    ]
  )
  uniLocs.dbgTex = getUniformLocations(
    gl, progs.dbgTex, [
      'position', 
      'size',
      'tex',
      'valueShift', 
      'valueScale'
    ]
  )

  return {
    progs, 
    uniLocs
  }
}

