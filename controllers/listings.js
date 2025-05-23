const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

//right code
// module.exports.index = async function (req, res) {
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", { allListings });
// };

//search btn
module.exports.index = async function (req, res) {
    const { location } = req.query;
    let allListings;

    if (location) {
        allListings = await Listing.find({
            location: new RegExp(location, 'i') // case-insensitive search
        });
    } else {
        allListings = await Listing.find({});
    }

    res.render("listings/index.ejs", { allListings });
};





module.exports.renderNewForm = function (req, res) {
    res.render("listings/new.ejs");
};

module.exports.showListing = async function (req, res) {
    let id = req.params.id.trim(); // Remove accidental spaces
    try {
        const listing = await Listing.findById(id).populate({
            path: "reviews", populate: {
                path: "author",
            }
        }).populate("owner");
        if (!listing) {
            // return res.status(404).send("Listing not found");
            req.flash("error", "Listing you requested for does not exist!");
            return res.redirect("/listings");
        }
        console.log(listing);
        res.render("listings/show", { listing });
    } catch (err) {
        console.error(err);
        res.status(400).send("Invalid Listing ID");
        res.redirect("/listings");
    }
};

// module.exports.createListing = async (req, res, next) => {
//     let response = await geocodingClient.forwardGeocode({
//         query: req.body.listing.location,
//         limit: 1,
//     }).send();



//     let url = req.file.path;
//     let filename = req.file.filename;


//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user._id;
//     newListing.image = { url, filename };

//     newListing.geometry = response.body.features[0].geometry;

//     let saveListing = await newListing.save();
//     console.log(saveListing);
//     req.flash("success", "New Listing Created!");
//     res.redirect("/listings");
// };

//without adding category
module.exports.createListing = async (req, res, next) => {
    try {
        // Geocoding request with timeout handling
        let response;
        try {
            response = await Promise.race([
                geocodingClient.forwardGeocode({
                    query: req.body.listing.location,
                    limit: 1,
                }).send(),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Geocoding timeout')), 10000); // 10 second timeout
                })
            ]);
        } catch (geocodeErr) {
            console.error("Geocoding error:", geocodeErr);
            req.flash("error", "Location service timed out. Please try again.");
            return res.redirect("/listings/new");
        }

        if (!response.body.features || response.body.features.length === 0) {
            req.flash("error", "Could not find coordinates for that location");
            return res.redirect("/listings/new");
        }

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        newListing.geometry = response.body.features[0].geometry;

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Create listing error:", err);
        req.flash("error", "Failed to create listing");
        res.redirect("/listings/new");
    }
};



module.exports.renderEditForm = async function (req, res) {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {

        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
};

//old code by apna college
// module.exports.updateListing = async function (req, res) {

//     let { id } = req.params;


//     let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
//     if (typeof req.file !== "undefined") {
//         let url = req.file.path;
//         let filename = req.file.filename;
//         listing.image = { url, filename };
//         await listing.save();
//     }

//     // const list = await Listing.findById(id);

//     // // If no new image data is provided, keep the existing image data
//     // if (!req.body.list.image || !req.body.list.image.url) {
//     //     req.body.list.image = {
//     //         filename: list.image.filename,
//     //         url: list.image.url
//     //     };
//     // }
//     req.flash("success", "Listing Updated!");
//     res.redirect(`/listings/${id}`);
// };



module.exports.updateListing = async function (req, res) {
    try {
        const { id } = req.params;

        // First find the existing listing
        let listing = await Listing.findById(id);

        // Update basic fields
        listing.set(req.body.listing);

        // Handle image update if new file is provided
        if (req.file) {
            // Delete old image from Cloudinary if exists
            if (listing.image && listing.image.filename) {
                try {
                    await cloudinary.uploader.destroy(listing.image.filename);
                } catch (cloudinaryErr) {
                    console.error("Cloudinary delete error:", cloudinaryErr);
                    // Continue even if deletion fails - we don't want to block the update
                }
            }

            // Set new image
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        // Save the updated listing
        await listing.save();

        req.flash("success", "Listing Updated!");
        return res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error("Update error:", err);
        req.flash("error", "Failed to update listing");
        // Redirect back to edit page if we have an ID, otherwise to listings index
        return res.redirect(req.params.id ? `/listings/${req.params.id}/edit` : "/listings");
    }
};














module.exports.destroyListing = async function (req, res) {
    let { id } = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};



