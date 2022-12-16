using BiochemicalVisualization
using Documenter

DocMeta.setdocmeta!(BiochemicalVisualization, :DocTestSetup, :(using BiochemicalVisualization); recursive=true)

makedocs(;
    modules=[BiochemicalVisualization],
    authors="Andreas Hildebrandt <andreas.hildebrandt@uni-mainz.de> and contributors",
    repo="https://github.com/hildebrandtlab/BiochemicalVisualization.jl/blob/{commit}{path}#{line}",
    sitename="BiochemicalVisualization.jl",
    format=Documenter.HTML(;
        prettyurls=get(ENV, "CI", "false") == "true",
        canonical="https://hildebrandtlab.github.io/BiochemicalVisualization.jl",
        assets=String[],
    ),
    pages=[
        "Home" => "index.md",
    ],
)

deploydocs(;
    repo="github.com/hildebrandtlab/BiochemicalVisualization.jl",
    devbranch="develop",
)
