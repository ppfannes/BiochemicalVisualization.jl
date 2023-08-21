function prepare_van_der_waals_model(
    ac::AbstractAtomContainer{T}) where {T<:Real}

    # todo: get vdw radii
    spheres = map(a -> Sphere(a.r, max(a.radius, T(1.0))), atoms(ac))
    filtered_spheres = filter(a -> occursin("C", a.name), atoms(ac))
    println(length(spheres))
    println(length(filtered_spheres))
    sphere_colors = [element_color(e) for e in atoms_df(ac).element]

    Representation{T}(primitives=Dict("spheres" => spheres), colors=Dict("sphere_colors" => sphere_colors))
end