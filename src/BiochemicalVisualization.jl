module BiochemicalVisualization

using BiochemicalAlgorithms

using Colors
using JSServe
using LinearAlgebra
using Statistics

asset_path(parts...) = normpath(joinpath(@__DIR__, "..", "assets", parts...))

export asset_path

include("core/visualize.jl")


end # module BiochemicalVisualization
