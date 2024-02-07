/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { handleEncryptedFiles } from "utils/encryption/filesCipher";
import {
	refreshAction,
	setSelectedShareFile,
	setSelectedSharedFiles,
	updateDecryptedSharedFilesAction
} from "state/mystorage/actions";
import "lightbox.js-react/dist/index.css";
import { useAppSelector } from "state";
import { File as FileType } from "api";
import { useAuth, useFetchData } from "hooks";
import getAccountType from "api/getAccountType";
import getPersonalSignature from "api/getPersonalSignature";
import Content from "pages/MyStorage/components/Content";
import { FaSquareShareNodes } from "react-icons/fa6";
import ShareModal from "./Components/ShareModal";
import UploadShareModal from "./Components/UploadShareModal";
import Imageview from "components/ImageView/Imageview";
import { Theme } from "state/user/reducer";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const Shared = () => {
	const [loaded, setloaded] = useState(false);
	const [isOpenShareUpload, setisOpenShareUpload] = useState(false);
	const dispatch = useDispatch();



	const {
		sharedFiles,
		sharedFolders,
		refresh,
		showShareModal,
		showPreview,
	} = useAppSelector((state) => state.mystorage);

	const [itemsPerPage, setItemsPerPage] = useState(
		window.innerWidth < 768 ? 6 : window.innerWidth < 1024 ? 1 : 2
	);

	useEffect(() => {
		const handleResize = () => {
			setItemsPerPage(
				window.innerWidth < 768 ? 6 : window.innerWidth < 1024 ? 1 : 15
			);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	const [totalSharedItems, setTotalSharedItems] = useState(0);
	const [totalSharedPages, setTotalSharedPages] = useState(0);
	const [currentSharedPage, setCurrentSharedPage] = useState(1);
	const [startSharedIndex, setStartSharedIndex] = useState(0);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [endSharedIndex, setEndSharedIndex] = useState(itemsPerPage - 1);

	const [totalReceivedItems, setTotalReceivedItems] = useState(0);
	const [totalReceivedPages, setTotalReceivedPages] = useState(0);
	const [currentReceivedPage, setCurrentReceivedPage] = useState(1);
	const [startReceivedIndex, setStartReceivedIndex] = useState(0);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [endReceivedIndex, setEndReceivedIndex] = useState(itemsPerPage - 1);


	console.log(sharedFolders);

	const [sharedByMe, setSharedByMe] = useState<FileType[]>([]);

	const [sharedWithMe, setSharedwithMe] = useState<FileType[]>([]);

	const [loading, setLoading] = useState(false);

	const personalSignatureRef = useRef<string | undefined>();

	const { name } = useAppSelector((state) => state.user);
	const { autoEncryptionEnabled } = useAppSelector(
		(state) => state.userdetail
	);
	const { logout } = useAuth();
	const accountType = getAccountType();
	const { fetchSharedContent } = useFetchData();

	const hasCalledGetPersonalSignatureRef = useRef<boolean>(false);

	async function fetchContent() {
		setLoading(true);

		if (
			!personalSignatureRef.current &&
			!hasCalledGetPersonalSignatureRef.current
		) {
			hasCalledGetPersonalSignatureRef.current = true;

			personalSignatureRef.current = await getPersonalSignature(
				name,
				autoEncryptionEnabled,
				accountType
			); //Promie<string | undefined>
			if (!personalSignatureRef.current) {
				toast.error("Failed to get personal signature");
				logout();
				return;
			}
		}
		const totalSharedItemsTemp = sharedFiles.sharedByMe.length;
		setTotalSharedItems(totalSharedItemsTemp);
		const totalSharedPagesTemp = Math.ceil(totalSharedItemsTemp / itemsPerPage);
		setTotalSharedPages(totalSharedPagesTemp);
		const tempStartSharedIndex =
			currentSharedPage === 1 ? 0 : 1 + (currentSharedPage - 2) * itemsPerPage;
		const tempEndSharedIndex = tempStartSharedIndex + itemsPerPage;
		setStartSharedIndex(tempStartSharedIndex);
		setEndSharedIndex(Math.min(tempEndSharedIndex, totalSharedItemsTemp));

		const sharedByMeStartIndex = Math.max(0, tempStartSharedIndex);
		const filesSharedByMe = sharedFiles.sharedWithMe.slice(
			sharedByMeStartIndex,
			sharedByMeStartIndex + itemsPerPage
		)

		const totalReceivedItemsTemp = sharedFiles.sharedWithMe.length;
		setTotalReceivedItems(totalReceivedItemsTemp);
		const totalReceivedPagesTemp = Math.ceil(totalReceivedItemsTemp / itemsPerPage);
		setTotalReceivedPages(totalReceivedPagesTemp);
		const tempStartReceivedIndex =
			currentReceivedPage === 1
				? 0
				: 1 + (currentReceivedPage - 2) * itemsPerPage;
		const tempEndReceivedIndex = tempStartReceivedIndex + itemsPerPage;
		setStartReceivedIndex(tempStartReceivedIndex);
		setEndReceivedIndex(Math.min(tempEndReceivedIndex, totalReceivedItemsTemp));

		const sharedWithMeStartIndex = Math.max(0, tempStartReceivedIndex);
		const filesSharedWithMe = sharedFiles.sharedWithMe.slice(
			sharedWithMeStartIndex,
			sharedWithMeStartIndex + itemsPerPage
		)

		const decryptedFilesSharedWithMe = await handleEncryptedFiles(
			filesSharedWithMe
				? filesSharedWithMe.slice()
				: [],
			personalSignatureRef.current || "",
			name,
			autoEncryptionEnabled,
			accountType,
			logout
		);


		const decryptedFilesSharedByMe = await handleEncryptedFiles(
			filesSharedByMe ? filesSharedByMe.slice() : [],
			personalSignatureRef.current || "",
			name,
			autoEncryptionEnabled,
			accountType,
			logout
		);

		if (
			decryptedFilesSharedWithMe &&
			decryptedFilesSharedByMe &&
			decryptedFilesSharedWithMe.length > 0 &&
			decryptedFilesSharedByMe.length > 0
		) {
			dispatch(
				updateDecryptedSharedFilesAction({
					sharedByMe: decryptedFilesSharedByMe,
					sharedWithMe: decryptedFilesSharedWithMe,
				})
			);
		}

		setSharedByMe(decryptedFilesSharedByMe || []);
		setSharedwithMe(decryptedFilesSharedWithMe || []);

		if (!decryptedFilesSharedByMe || !decryptedFilesSharedWithMe) {
			toast.error("Failed to decrypt content");
			fetchSharedContent(setLoading);
		}
	}

	useEffect(() => {
		fetchSharedContent()
		dispatch(refreshAction(true))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);


	const paginateContent = async () => {

		const totalSharedItemsTemp = sharedFiles.sharedByMe.length;
		console.log(sharedFiles.sharedByMe)
		const totalSharedPagesTemp = Math.ceil(totalSharedItemsTemp / itemsPerPage);
		const totalReceivedItemsTemp = sharedFiles.sharedWithMe.length;
		const totalReceivedPagesTemp = Math.ceil(totalReceivedItemsTemp / itemsPerPage);
		setTotalSharedItems(totalSharedItemsTemp);
		setTotalReceivedItems(totalReceivedItemsTemp);
		setTotalSharedPages(totalSharedPagesTemp);
		setTotalReceivedPages(totalReceivedPagesTemp);

		const tempSharedStartIndex =
			currentSharedPage === 1 ? 0 : 1 + (currentSharedPage - 2) * itemsPerPage;
		const tempReceivedStartIndex =
			currentReceivedPage === 1 ? 0 : 1 + (currentReceivedPage - 2) * itemsPerPage;
		const tempSharedEndIndex = tempSharedStartIndex + itemsPerPage;
		const tempReceivedEndIndex = tempReceivedStartIndex + itemsPerPage;

		setStartSharedIndex(tempSharedStartIndex);
		setStartReceivedIndex(tempReceivedStartIndex);
		setEndSharedIndex(Math.min(tempSharedEndIndex, totalSharedItemsTemp));
		setEndReceivedIndex(Math.min(tempReceivedEndIndex, totalReceivedItemsTemp));


		const filesSharedStartIndex = Math.max(0, tempSharedStartIndex);
		const filesItemsCount = itemsPerPage;
		const filesReceivedStartIndex = Math.max(0, tempReceivedStartIndex);

		const currentSharedFiles = sharedFiles.sharedByMe.slice(
			filesSharedStartIndex,
			filesSharedStartIndex + filesItemsCount
		)
		const currentReceivedFiles = sharedFiles.sharedWithMe.slice(
			filesReceivedStartIndex,
			filesReceivedStartIndex + filesItemsCount
		)

		// TODO: decrypt files

		if (!currentSharedFiles || !currentReceivedFiles) {
			toast.error("Failed to decrypt content");
			fetchSharedContent(setLoading);
		}

		setSharedByMe(currentSharedFiles);
		setSharedwithMe(currentReceivedFiles);
	}

	useEffect(() => {
		paginateContent().then(() => {
			fetchContent().then(() => {
				setLoading(false);
				dispatch(refreshAction(false))
			})
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sharedFiles.sharedWithMe.length, sharedFiles.sharedByMe.length, currentSharedPage, currentReceivedPage])


	useEffect(() => {
		if (refresh) {
			fetchContent().then(() => {
				setLoading(false);
				dispatch(refreshAction(false))
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sharedFiles]);

	const { theme } = useAppSelector((state) => state.user);

	return (
		<section>
			{isOpenShareUpload && (
				<UploadShareModal
					isOpen={isOpenShareUpload}
					setIsopen={setisOpenShareUpload}
				></UploadShareModal>
			)}
			{showShareModal && <ShareModal />}

			<Imageview
				isOpen={showPreview}
				files={[...sharedByMe,
				...sharedWithMe]}
				loaded={loaded}
				setloaded={setloaded}
			></Imageview>
			<h3 className="my-2 text-xl">Shared files</h3>
			<button
				className="animated-bg-btn w-[230px] mb-2 p-3 rounded-xl bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
				onClick={() => {
					dispatch(setSelectedSharedFiles(undefined))
					dispatch(setSelectedShareFile(undefined));
					setisOpenShareUpload(!isOpenShareUpload);
				}}
			>
				<span className="btn-transition"></span>
				<label className="flex items-center justify-center w-full gap-2 text-sm text-white">
					<FaSquareShareNodes className="animated-btn-icon" /> Share Files
				</label>
			</button>
			<div className="hidden w-full lg:flex">
				<div className="w-[99%] share-content">
					<Content
						actionsAllowed={true}
						loading={loading}
						showHorizontalFolders={false}
						files={sharedByMe}
						folders={sharedFolders.sharedByMe}
						view="list"
						showFolders={true}
						filesTitle="Shared"
						identifier={1}
						setloaded={setloaded}
					/>
				</div>
				<div className="flex-shrink-0 mb-[50px] sm:mb-0">
					<div className={"flex items-center justify-between py-2 mt-3 text-sm bg-white border-t border-gray-200"
						+ (theme === Theme.DARK ? " dark-theme " : " ")}>
						<div className="text-xs">
							Showing {totalSharedItems === 0 ? startSharedIndex : startSharedIndex + 1} to{" "}
							{Math.min(endSharedIndex, totalSharedItems)} of {totalSharedItems} results
						</div>
						<div className="flex items-center space-x-2">
							<button
								className={`p-2 rounded flex items-center gap-2 ${currentSharedPage === 1
									? "cursor-not-allowed opacity-50"
									: "hover:bg-gray-200"
									}`}
								onClick={() =>
									setCurrentSharedPage((prevPage) => Math.max(prevPage - 1, 1))
								}
								disabled={currentSharedPage === 1}
							>
								<HiChevronLeft className="w-5 h-5" />
								<span className="hidden md:inline">Prev</span>
							</button>
							<button
								className={`p-2 rounded flex items-center gap-2 ${totalSharedPages === 0 || currentSharedPage === totalSharedPages
									? "cursor-not-allowed opacity-50"
									: "hover:bg-gray-200"
									}`}
								onClick={() =>
									setCurrentSharedPage((prevPage) => Math.min(prevPage + 1, totalSharedPages))
								}
								disabled={totalSharedPages === 0 || currentSharedPage === totalSharedPages}
							>
								<span className="hidden md:inline">Next</span>{" "}
								<HiChevronRight className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
				<span className="w-[2%]"></span>
				<div className="w-[99%] share-content">
					<Content
						actionsAllowed={true}
						loading={loading}
						files={sharedWithMe}
						showHorizontalFolders={false}
						folders={sharedFolders.sharedWithMe}
						view="list"
						showFolders={true}
						filesTitle="Received"
						identifier={2}
						setloaded={setloaded}
					/>
				</div>

			</div>
			<div className="lg:hidden w-[99%] flex-col justify-evenly items-center mb-[50px] ">
				<div>
					<Content
						actionsAllowed={true}
						loading={loading}
						files={sharedByMe}
						showHorizontalFolders={false}
						folders={sharedFolders.sharedByMe}
						view="list"
						showFolders={true}
						filesTitle="Shared"
						identifier={3}
						setloaded={setloaded}
					/>
				</div>
				<div className="flex-shrink-0 mb-[50px] sm:mb-0">
					<div className={"flex items-center justify-between py-2 mt-3 text-sm bg-white border-t border-gray-200"
						+ (theme === Theme.DARK ? " dark-theme " : " ")}>
						<div className="text-xs">
							Showing {totalSharedItems === 0 ? startSharedIndex : startSharedIndex + 1} to{" "}
							{Math.min(endSharedIndex, totalSharedItems)} of {totalSharedItems} results
						</div>
						<div className="flex items-center space-x-2">
							<button
								className={`p-2 rounded flex items-center gap-2 ${currentSharedPage === 1
									? "cursor-not-allowed opacity-50"
									: "hover:bg-gray-200"
									}`}
								onClick={() =>
									setCurrentSharedPage((prevPage) => Math.max(prevPage - 1, 1))
								}
								disabled={currentSharedPage === 1}
							>
								<HiChevronLeft className="w-5 h-5" />
								<span className="hidden md:inline">Prev</span>
							</button>
							<button
								className={`p-2 rounded flex items-center gap-2 ${totalSharedPages === 0 || currentSharedPage === totalSharedPages
									? "cursor-not-allowed opacity-50"
									: "hover:bg-gray-200"
									}`}
								onClick={() =>
									setCurrentSharedPage((prevPage) => Math.min(prevPage + 1, totalSharedPages))
								}
								disabled={totalSharedPages === 0 || currentSharedPage === totalSharedPages}
							>
								<span className="hidden md:inline">Next</span>{" "}
								<HiChevronRight className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>

				<div>
					<Content
						actionsAllowed={true}
						loading={loading}
						files={sharedWithMe}
						showHorizontalFolders={false}
						folders={sharedFolders.sharedWithMe}
						view="list"
						showFolders={true}
						filesTitle="Received"
						identifier={4}
						setloaded={setloaded}
					/>
				</div>
				<div className="flex-shrink-0 mb-[50px] sm:mb-0">
					<div className={"flex items-center justify-between py-2 mt-3 text-sm bg-white border-t border-gray-200"
						+ (theme === Theme.DARK ? " dark-theme " : " ")}>
						<div className="text-xs">
							Showing {totalReceivedItems === 0 ? startReceivedIndex : startReceivedIndex + 1} to{" "}
							{Math.min(endReceivedIndex, totalReceivedItems)} of {totalReceivedItems} results
						</div>
						<div className="flex items-center space-x-2">
							<button
								className={`p-2 rounded flex items-center gap-2 ${currentReceivedPage === 1
									? "cursor-not-allowed opacity-50"
									: "hover:bg-gray-200"
									}`}
								onClick={() =>
									setCurrentReceivedPage((prevPage) => Math.max(prevPage - 1, 1))
								}
								disabled={currentReceivedPage === 1}
							>
								<HiChevronLeft className="w-5 h-5" />
								<span className="hidden md:inline">Prev</span>
							</button>
							<button
								className={`p-2 rounded flex items-center gap-2 ${totalReceivedPages === 0 || currentReceivedPage === totalReceivedPages
									? "cursor-not-allowed opacity-50"
									: "hover:bg-gray-200"
									}`}
								onClick={() =>
									setCurrentReceivedPage((prevPage) => Math.min(prevPage + 1, totalReceivedPages))
								}
								disabled={totalReceivedPages === 0 || currentReceivedPage === totalReceivedPages}
							>
								<span className="hidden md:inline">Next</span>{" "}
								<HiChevronRight className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>

	);
};

export default Shared;
