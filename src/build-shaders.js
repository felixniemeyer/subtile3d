import { createProgramFromSources } from './3rd-party/shader-program-build-tool.js'

import vsGenPlasma from './shader/gen-plasma.vert'
import fsGenPlasma from './shader/gen-plasma.frag'

import vsGenGeo from './shader/gen-geo.vert'
import fsGenGeo from './shader/gen-geo.frag'

import vsRenderGeo from './shader/render-geo.vert'
import fsRenderGeo from './shader/render-geo.frag'

import vsDbgTex from './shader/dbg-tex.vert'
import fsDbgTex from './shader/dbg-tex.frag'

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
      vsGenPlasma, 
      fsGenPlasma
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
      vsGenGeo, 
      fsGenGeo
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
      vsRenderGeo, 
      fsRenderGeo
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
      'fog'
    ]
  )

  console.log('building shader', 'dbgTex')
  progs.dbgTex = createProgramFromSources(gl, [
      vsDbgTex, 
      fsDbgTex
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

