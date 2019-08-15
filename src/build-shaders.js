import { createProgramFromSources } from './3rd-party/shader-program-build-tool.js'

import vsPlasma from './shader/plasma.vert'
import fsPlasma from './shader/plasma.frag'

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

  progs.genPlasma = createProgramFromSources(gl, [
      vsPlasma, 
      fsPlasma
    ]
  )
  uniLocs.genPlasma = getUniformLocations(
    gl, progs.genPlasma, [
      'time',
      'turbulence'
    ]
  )

  progs.genGeo = createProgramFromSources(gl, [
      vsGenGeo, 
      fsGenGeo
    ]
  )
  uniLocs.genGeo = getUniformLocations(
    gl, progs.plasma, [
    ]
  )

  progs.renderGeo = createProgramFromSources(gl, [
      vsRenderGeo, 
      fsRenderGeo
    ]
  )
  uniLocs.renderGeo = getUniformLocations(
    gl, progs.renderGeo, [
      'verticesTexture', 
      'quadCountSqrt',
      'quadCountSqrtInverse',
      'vertexCountSqrt',
      'vertexCountSqrtInverse',
      // anim step specific
      'camera',
      'progress',
      'pixelSize'
    ]
  )

  progs.dbgTex = createProgramFromSources(gl, [
      vsDbgTex, 
      fsDbgTex
    ]
  )
  uniLocs.dbgTex = getUniformLocations(
    gl, progs.dbgTex, [
      'position', 
      'size',
      'tex'
    ]
  )

  return {
    progs, 
    uniLocs
  }
}

