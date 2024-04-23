function prepare_van_der_waals_model(
    ac::AbstractAtomContainer{T}) where {T<:Real}

    # todo: get vdw radii
    spheres = map(a -> Sphere(a.r, max(a.radius, T(1.0))), atoms(ac))
    sphere_colors = [element_color(e) for e in atoms(ac).element]
    meta_data = [(at.name, String(Symbol(at.element)), at.number) for at in atoms(ac)]

    Representation{T}(primitives=Dict("spheres" => spheres), meta_data=meta_data, colors=Dict("sphere_colors" => sphere_colors))
end