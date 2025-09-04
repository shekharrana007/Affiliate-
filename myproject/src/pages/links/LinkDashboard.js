import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { serverEndpoint } from '../../config/config';
import { Modal } from 'react-bootstrap';
import { usePermission } from '../../rbac/permissions';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useNavigate } from 'react-router-dom';


function LinkDashboard() {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [linksData, setLinksData] = useState([]);
    const [formData, setFormData] = useState({
        campaignTittle: '',
        originalUrl: '',
        category: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const permission = usePermission();

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [removeThumbnail, setRemoveThumbnail] = useState(false);

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(2);
    const [totalCount, setTotalCount] = useState(0);
    const [dataVersion, setDataVersion] = useState(0); // Track data updates
    // MUI DataGrid require array of fields as the sort model when using server side sorting.
    // When using client-side pagination/sorting/filter/search, MUI takes care of everything
    // abstracting the implementation details. Since we're now managing the data using server,
    // we need to manage everything and let DataGrid know what is happening.
    const [sortModel, setSortModel] = useState([
        { field: 'createdAt', sort: "desc" }
    ]);


    const handleModalShow = (isEdit, data = {}) => {
        if (isEdit) {
            setFormData({
                id: data._id,
                campaignTittle: data.campaignTittle,
                originalUrl: data.originalUrl,
                category: data.category
            });
            // Set existing thumbnail preview if available
            if (data.thumbnail) {
                setPreviewUrl(data.thumbnail);
            } else {
                setPreviewUrl('');
            }
            setThumbnailFile(null); // Reset file input
        } else {
            setFormData({
                campaignTittle: '',
                originalUrl: '',
                category: ''
            });
            setPreviewUrl('');
            setThumbnailFile(null);
            setRemoveThumbnail(false);
        }
        setIsEdit(isEdit);
        setShowModal(true);
    };
    const handleModalClose = () => {
        setShowModal(false);
    };
    const [showDeleteModal, setShowDeleteModal] =
        useState(false);
    const handleDeleteModalShow = (linkId) => {
        setFormData({
            id: linkId
        });
        setShowDeleteModal(true);
    };
    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
    };
    const handleDeleteSubmit = async () => {
        try {
            await axios.delete(`${serverEndpoint}/links/${formData.id}`,
                { withCredentials: true });
            setFormData({
                campaignTittle: '',
                originalUrl: '',
                category: ''
            });
            fetchLinks();
        } catch (error) {
            setErrors({ message: 'Something went wrong, please try again' });

        } finally {
            handleDeleteModalClose();
        }
    };
    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    const validate = () => {
        let newErrors = {};
        let isValid = true;
        if (formData.campaignTittle.length === 0) {
            newErrors.campaignTittle = "Campaign Tittle is mandatory";
            isValid = false;
        }

        if (formData.originalUrl.length === 0) {
            newErrors.originalUrl = "Original URL is mandatory";
            isValid = false;
        }

        if (formData.category.length === 0) {
            newErrors.category = "Category is mandatory";

            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    }
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (validate()) {
            const body = {
                campaign_tittle: formData.campaignTittle,
                original_url: formData.originalUrl,
                category: formData.category
            };
            const configuration = {
                withCredentials: true
            };
            try {
                console.log('Form data before submission:', formData);
                console.log('Thumbnail file:', thumbnailFile);
                console.log('Remove thumbnail:', removeThumbnail);
                console.log('Preview URL:', previewUrl);
                
                if (thumbnailFile) {
                    console.log('Uploading new thumbnail...');
                    const thumbnailUrl = await uploadToCloudinary(thumbnailFile);
                    body.thumbnail = thumbnailUrl;
                    console.log('New thumbnail URL:', thumbnailUrl);
                } else if (isEdit && removeThumbnail) {
                    // If user wants to remove the thumbnail
                    console.log('Removing thumbnail...');
                    body.thumbnail = null;
                } else if (isEdit && previewUrl && !thumbnailFile && !removeThumbnail) {
                    // If editing and there's an existing thumbnail but no new file selected, 
                    // don't include thumbnail in the update to preserve the existing one
                    console.log('Preserving existing thumbnail...');
                    delete body.thumbnail;
                }
                
                console.log('Final request body:', body);
                console.log('Is edit mode:', isEdit);
                console.log('Link ID:', formData.id);
                
                if (isEdit) {
                    console.log('Making PUT request to:', `${serverEndpoint}/links/${formData.id}`);
                    const response = await axios.put(`${serverEndpoint}/links/${formData.id}`, body, configuration);
                    console.log('Update response:', response.data);
                }
                else {
                    console.log('Making POST request to:', `${serverEndpoint}/links`);
                    const response = await axios.post(`${serverEndpoint}/links`, body, configuration);
                    console.log('Create response:', response.data);
                }
                setFormData({
                    campaignTittle: '',
                    originalUrl: '',
                    category: ''
                });
                setThumbnailFile(null);
                setPreviewUrl('');
                setRemoveThumbnail(false);

                // Force refresh the links data to show updated thumbnail
                await fetchLinks();
                setSuccessMessage(isEdit ? 'Link updated successfully!' : 'Link created successfully!');
                setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
                handleModalClose(); // Close modal after successful update
            } catch (error) {
                setSuccessMessage(''); // Clear any success message
                console.error('Form submission error:', error);
                console.error('Error response:', error.response?.data);
                
                if (error.response?.data?.code === "INSUFFICIENT_FUNDS") {
                    setErrors({
                        message: "You do not have enough credits to perform this action. Add funds to your account using Manage payment option"
                    });
                }
                else if (error.response?.data?.error) {
                    setErrors({ message: error.response.data.error });
                }
                else if (error.response?.data?.message) {
                    setErrors({ message: error.response.data.message });
                }
                else {
                    setErrors({ message: 'Something went wrong, please try again' });
                }
            }
        }
    };


    const uploadToCloudinary = async (file) => {
        try {
            console.log('Uploading file to Cloudinary:', file.name);
            const { data } = await axios.post(`${serverEndpoint}/links/generate-upload-signature`, {},
                { withCredentials: true }
            );
            console.log('Upload signature data:', data);
            
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", data.apiKey);
            formData.append("timestamp", data.timestamp);
            formData.append("signature", data.signature);
            
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
                formData
            );
            console.log('Cloudinary upload response:', response.data);
            return response.data.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new Error('Failed to upload image to Cloudinary');
        }
    };


    const fetchLinks = async () => {
        try {

            setLoading(true);
            const sortField = sortModel[0]?.field || "createdAt";
            const sortOrder = sortModel[0]?.sort || "desc";
            const params = {
                currentPage: currentPage,
                pageSize: pageSize,
                searchTerm: searchTerm,
                sortField: sortField,
                sortOrder: sortOrder,
                _t: Date.now() // Add timestamp to prevent caching
            };


            const response = await axios.get(`${serverEndpoint}/links`, {
                params: params,
                withCredentials: true
            });
            setLinksData(response.data.data.links);
            setTotalCount(response.data.data.total);
            setDataVersion(prev => prev + 1); // Increment version to force re-render
        } catch (error) {
            console.log(error);
            setErrors({ message: "Unable to fetch links at the moment, please try again" });
        } finally {
            setLoading(false);
        }
    };
    // Anything mentioned in the dependency array of useEffect will trigger
    // useEffect execution if there is change any value.

    useEffect(() => {
        fetchLinks();
    }, [currentPage, pageSize, sortModel,
        searchTerm]);
    const columns = [
        {field:'thumbnail',headerName:'Thumbnail',flex:2,sortable:false,
            renderCell:(params)=>(
                params.row.thumbnail ?(
                    <img src={params.row.thumbnail}alt="Thumbnail" style={{maxHeight:'40px'}} />
                ):(
                    <span style={{color:'#888'}}>No Image</span>
                )
            )
        },
        { field: 'campaignTittle', headerName: 'Campaign', flex: 2 },
        {
            field: 'originalUrl', headerName: 'URL', flex: 3, renderCell: (params) => (
                <a href={`${serverEndpoint}/links/r/${params.row._id}`} target="_blank" rel="noopener noreferrer">
                    {params.row.originalUrl}
                </a>
            ),
        },
        { field: 'category', headerName: 'Category', flex: 2 },
        { field: 'clickCount', headerName: 'Clicks', flex: 1 },
        {
            field: 'action', headerName: 'Action', flex: 1, sortable: false, renderCell: (params) => (
                <>
                    {permission.canEditLink && (
                        <IconButton onClick={() => handleModalShow(true, params.row)}>
                            <EditIcon />
                        </IconButton>
                    )}
                    {permission.canDeleteLink && (
                        <IconButton onClick={() => handleDeleteModalShow(params.row._id)}>
                            <DeleteIcon />
                        </IconButton>
                    )}
                    {permission.canViewLink && (
                        <IconButton>
                            <AssessmentIcon onClick={() => {
                                navigate(`/analytics/${params.row._id}`);
                            }} />
                        </IconButton>
                    )}

                </>
            )
        },
        {
            field: 'share',
            headerName: 'Share Affiliate Link',
            sortable: false,
            flex: 1.5,
            renderCell: (params) => {
                const shareURL =
                    `${serverEndpoint}/link/r/${params.row._id}`;
                return (
                    <button
                        className='btn btn-outlineprimary btn-sm'
                        onClick={(e) => {
                            navigator.clipboard.writeText(shareURL);
                        }}
                    >
                        Copy
                    </button>
                );
            }
        }

    ];


    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Manage Affiliate Links</h2>
                {permission.canCreateLink && (
                    <button className="btn btn-primary btn-lg fw-bold shadow-sm" onClick={() => handleModalShow(false)}>
                        Add
                    </button>
                )}
            </div>


            {errors.message && (<div className="alert alert-danger"
                role="alert">
                {errors.message}
            </div>
            )}
            {successMessage && (<div className="alert alert-success"
                role="alert">
                {successMessage}
            </div>
            )}
            <div className='mb-2'>
                <input type='text'
                    className='form-control'
                    placeholder='Enter Campaign title, Original URL, or Category'
                    onChange={(e) => {

                        setSearchTerm(e.target.value);

                        setCurrentPage(0); // Reset to first page
                    }}
                />
            </div>

            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    key={dataVersion} // Force re-render when data version changes
                    getRowId={(row) => row._id}
                    rows={linksData}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: pageSize, page: currentPage
                            },
                        }
                    }}
                    paginationMode="server"
                    pageSizeOptions={[2, 3, 4]}
                    onPaginationModelChange=
                    {(newPage) => {

                        setCurrentPage(newPage.page);

                        setPageSize(newPage.pageSize);
                    }}
                    onPageSizeChange={(newPageSize) => {
                        setPageSize(newPageSize);
                        setCurrentPage(0);
                    }}
                    rowCount={totalCount}
                    sortingMode='server'
                    sortModel={sortModel}
                    onSortModelChange={(model) => {
                        setSortModel(model);
                        setCurrentPage(0);
                    }}

                    disableRowSelectionOnClick
                    showToolbar
                    sx={{
                        fontFamily: "inherit"
                    }}
                />
            </div>
            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? "Edit Link" : "Add Link"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="campaignTittle" className="form-label">
                                Campaign Title
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.campaignTittle ? 'is-invalid' : ''}`}
                                id="campaignTittle"
                                name="campaignTittle"
                                value={formData.campaignTittle}
                                onChange={handleChange}
                            />
                            {errors.campaignTittle && (
                                <div className="invalid-feedback">
                                    {errors.campaignTittle}
                                </div>
                            )}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="originalUrl" className="form-label">
                                Original URL
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.originalUrl ? 'is-invalid' : ''}`}
                                id="originalUrl"
                                name="originalUrl"
                                value={formData.originalUrl}
                                onChange={handleChange}
                            />
                            {errors.originalUrl && (
                                <div className="invalid-feedback">
                                    {errors.originalUrl}
                                </div>
                            )}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="category" className="form-label">
                                Category
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                            />
                            {errors.category && (
                                <div className="invalid-feedback">
                                    {errors.category}
                                </div>
                            )}
                        </div>

                        <div className='mb-3'>
                            <label htmlFor="thumbnailFile" className='form-label'>Thumbnail</label>
                            <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setThumbnailFile(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                    setRemoveThumbnail(false); // Uncheck remove option when new file is selected
                                }
                            }} className='form-control' />
                            {isEdit && previewUrl && !thumbnailFile && (
                                <div className='mt-2'>
                                    <div className="form-check">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id="removeThumbnail"
                                            checked={removeThumbnail}
                                            onChange={(e) => setRemoveThumbnail(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="removeThumbnail">
                                            Remove existing thumbnail
                                        </label>
                                    </div>
                                </div>
                            )}
                            {previewUrl && !removeThumbnail && (
                                <div className='mt-2'>
                                    <img src={previewUrl} width="150" alt='thumbnail-preview'
                                        className='img-responsive border rounded-2' />
                                </div>
                            )}
                        </div>

                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary">
                                Submit
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal()}>
                <Modal.Header closeButton>

                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body> Are you sure you want to delete this link?
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-secondary" onClick={() => setShowDeleteModal()}> Cancel
                    </button>
                    <button className="btn btn-danger" onClick={handleDeleteSubmit}> Delete
                    </button>
                </Modal.Footer>
            </Modal>

        </div>

    );

}
export default LinkDashboard;