export Representation

struct Representation{T <: Real}
    primitives::Dict{String, AbstractVector{GeometryPrimitive{3, T}}}
    vertices::AbstractVector{T}
    connections::AbstractVector{Int}
    colors::Dict{String, AbstractVector{String}}

    function Representation{T}(;
            primitives=Dict{String, Vector{GeometryPrimitive{3, T}}}(),
            vertices=Vector{T}(),
            connections=Vector{Int}(),
            colors=Dict{String, Vector{String}}()) where {T}
        new(primitives, vertices, connections, colors)
    end
end

MsgPack.msgpack_type(::Type{Cylinder3{T}})      where {T} = MsgPack.StructType()
MsgPack.msgpack_type(::Type{Sphere{T}})         where {T} = MsgPack.StructType()
MsgPack.msgpack_type(::Type{Representation{T}}) where {T} = MsgPack.StructType()

# convenience constructors
Sphere(center::Vector3{T}, r::T) where {T<:Real} = Sphere{T}(Point3{T}(center...), r)
Cylinder(origin::Vector3{T}, extremity::Vector3{T}, radius::T) where {T<:Real} = 
    Cylinder(Point3{T}(origin...), Point3{T}(extremity...), radius)

center(s::Sphere)   = s.center
center(c::Cylinder) = c.origin + 0.5 * (c.extremity - c.origin)