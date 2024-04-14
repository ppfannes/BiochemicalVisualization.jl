function prepare_van_der_waals_model(
    ac::AbstractAtomContainer{T}) where {T<:Real}

    # todo: get vdw radii
    spheres = map(a -> Sphere(a.r, max(a.radius, T(1.0))), atoms(ac))
    sphere_colors = [element_color(atom.element) for atom in eachatom(ac)]

    Representation{T}(primitives=Dict("spheres" => spheres), colors=Dict("sphere_colors" => sphere_colors))
end