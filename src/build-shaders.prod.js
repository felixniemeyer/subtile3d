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

const getUniformLocations = (gl, program, uniforms) => {
  var uName, uniformMap = {}
  for( uName in uniforms ){
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
    gl, progs.genPlasma, {...vsGenPlasma.uniforms, ...fsGenPlasma.uniforms}
  )

  console.log('building shader', 'genGeo')
  progs.genGeo = createProgramFromSources(gl, [
      vsGenGeo.sourceCode, 
      fsGenGeo.sourceCode
    ]
  )
  uniLocs.genGeo = getUniformLocations(
    gl, progs.genGeo, {...vsGenGeo.uniforms, ...fsGenGeo.uniforms }
  )

  console.log('building shader', 'renderGeo')
  progs.renderGeo = createProgramFromSources(gl, [
      vsRenderGeo.sourceCode, 
      fsRenderGeo.sourceCode
    ]
  )
  uniLocs.renderGeo = getUniformLocations(
    gl, progs.renderGeo, {...vsRenderGeo.uniforms, ...fsRenderGeo.uniforms }
  )

  console.log('building shader', 'dbgTex')
  progs.dbgTex = createProgramFromSources(gl, [
      vsDbgTex.sourceCode, 
      fsDbgTex.sourceCode
    ]
  )
  uniLocs.dbgTex = getUniformLocations(
    gl, progs.dbgTex, {...vsDbgTex.uniforms, ...fsDbgTex.uniforms }
  )

  return {
    progs, 
    uniLocs
  }
}

